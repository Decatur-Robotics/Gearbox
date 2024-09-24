import { removeWhitespace } from "@/lib/Utils";



test(removeWhitespace.name, () => {


  expect(removeWhitespace("Hello World")).toBe("helloworld");
  expect(removeWhitespace("Hello World!")).toBe("helloworld!");
  expect(removeWhitespace("Hello World!123")).toBe("helloworld!123");
});