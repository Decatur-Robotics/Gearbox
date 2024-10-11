import CollectionId from "@/lib/client/CollectionId";
import DbInterface from "@/lib/client/dbinterfaces/DbInterface";
import { NoReaderError, UnsupportedOperationError } from "@/lib/client/dbinterfaces/DbInterfaceErrors";
import { MultiDbInterface } from "@/lib/client/dbinterfaces/MultiDbInterface";

function createInterfaces(): [DbInterface, MultiDbInterface] {
  const mockDbInterface: DbInterface = {
    init: jest.fn(),
    addObject: jest.fn((_, obj) => Promise.resolve(obj)),
    deleteObjectById: jest.fn(),
    updateObjectById: jest.fn(),
    findObjectById: jest.fn(),
    findObject: jest.fn(),
    findObjects: jest.fn(),
    countObjects: jest.fn()
  };

  const multiDbInterface = new MultiDbInterface([mockDbInterface, mockDbInterface], mockDbInterface);

  return [mockDbInterface, multiDbInterface];
}

type FunctionGroup = {
  /**
   * Appears in the test suite name and test name
   */
  label: string;
  /**
   * Names of functions to test
   */
  functions: string[];
  /**
   * Specifies the condition to test the function calls against
   * 
   * @param result the output of expect()
   * @param dbInt The MultiDbInterface instance
   * @returns Nothing
   */
  expect: (result: jest.JestMatchers<any>, dbInt: MultiDbInterface) => void;
  /**
   * Function to run before the test suite
   */
  before?: (dbInt: MultiDbInterface) => void;
  /**
   * If true, the function call will be wrapped in a function before being
   * passed to expect(). In expect(), result will be with the function call, 
   * rather than the mock function
   */
  wrapCall?: boolean;
}

const functionGroups: FunctionGroup[] = [
  { 
    label: "Calls all writers, but no readers", 
    functions: ["addObject", "deleteObjectById", "updateObjectById"], 
    expect: (result, dbInt) => result.toHaveBeenCalledTimes(dbInt.writers.length)
  },
  { 
    label: "Calls only reader", 
    functions: ["findObjectById", "findObject", "findObjects", "countObjects"], 
    expect: (result, dbInt) => result.toHaveBeenCalledTimes(dbInt.reader ? 1 : 0),
  },
  { 
    label: "Calls all writers and reader", 
    functions: ["init"], 
    expect: (result, dbInt) => result.toHaveBeenCalledTimes(dbInt.writers.length + (dbInt.reader ? 1 : 0))
  },
  { 
    label: "Error on find call if reader is not defined",
    functions: ["findObjectById", "findObject", "findObjects", "countObjects"],
    expect: (result) => result.toThrow(/No reader/), // I couldn't get Jest to pick up the custom error types, so we're using regex for now -Renato, 2024
    before: (dbInt) => dbInt.reader = undefined,
    wrapCall: true
  },
  {
    label: "Error on find call if reader does not support function",
    functions: ["findObjectById", "findObject", "findObjects", "countObjects"],
    expect: (result) => result.toThrow(/does not support/),
    before: (dbInt) => dbInt.reader = {} as any,
    wrapCall: true
  }
];

functionGroups.forEach((group) => {
  const [mockDbInterface, multiDbInterface] = createInterfaces();

  group.before?.(multiDbInterface);
  describe(group.label, () => {
    group.functions.forEach(func => {
      test(`${MultiDbInterface.name}.${func}: ${group.label}`, async () => {
        if (group.wrapCall) {
          const expectation = expect(() => (multiDbInterface as any)[func](CollectionId.Users, {}));
          group.expect(expectation, multiDbInterface);
          return;
        }

        // Disabling type checking seems to be only way to find a function by its name
        await (multiDbInterface as any)[func](CollectionId.Users, {});
        group.expect(expect((mockDbInterface as any)[func]), multiDbInterface);
      });
    });
  });
});