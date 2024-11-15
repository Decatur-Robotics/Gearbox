import { LinkedList } from "@/lib/Types";

// Add to test plan!

test(`${LinkedList.name}.constructor: Sets head if not given array, but sets multiple if given array`, () => {
  let list = new LinkedList<any>({ i: 0 });
  expect(list.first()).toStrictEqual({ i: 0, prev: undefined, next: undefined });

  const array = [0, 1, 2, 3, 4];
  list = new LinkedList(array.map(i => ({ i })));
  
  let node = list.first();
  for (let i = 0; i < array.length; i++) {
    expect(node!.i).toBe(i);
    node = node!.next;
  }
});

test(`${LinkedList.name}.${LinkedList.prototype.size.name}`, () => {
  const list = new LinkedList({ i: 0 });

  const node = list.first()!;
  for (let i = 1; i < 10; i++) {
    list.insertBefore(node, { i });
    expect(list.size()).toBe(i+1);
  }
});

test(`${LinkedList.name}.${LinkedList.prototype.last.name}`, () => {
  const list = new LinkedList({ i: 0 });

  let node = list.first()!;
  for (let i = 1; i < 10; i++) {
    list.insertAfter(node, { i });
    expect(list.last()?.i).toBe(i);
    node = list.last()!;
  }
});

test(`${LinkedList.name}.${LinkedList.prototype.setHead.name}`, () => {
  const list = new LinkedList([{ i: 0 }, { i: 1 }]);

  list.setHead({ i: 2 });

  expect(list.first()).toStrictEqual({ i: 2, prev: undefined, next: undefined });
  expect(list.size()).toBe(1);
});

test(`${LinkedList.name}.${LinkedList.prototype.insertBefore.name}: Updates next on insertedNode and prev on existingNode`, () => {
  const list = new LinkedList({ i: 0 });
  let existing = list.first()!;

  const inserted = list.insertBefore(existing, { i: 1 });

  expect(inserted.next?.i).toBe(existing.i);
  expect(existing.prev?.i).toBe(inserted.i);
});

test(`${LinkedList.name}.${LinkedList.prototype.insertBefore.name}: Updates head if inserting before head`, () => {
  const list = new LinkedList({ i: 0 });
  let existing = list.first()!;

  list.insertBefore(existing, { i: 1 });

  expect(list.first()?.i).toBe(1);
});

test(`${LinkedList.name}.${LinkedList.prototype.insertBefore.name}: Updates existing previous node`, () => {
  const list = new LinkedList([{ i: 0 }, { i: 1 }]);
  let existing = list.last()!;

  const inserted = list.insertBefore(existing, { i: 2 });

  expect(inserted.prev?.i).toBe(0);
  expect(list.first()?.next?.i).toBe(2);
});

test(`${LinkedList.name}.${LinkedList.prototype.insertAfter.name}: Updates prev on insertedNode and next on existingNode`, () => {
  const list = new LinkedList({ i: 0 });
  let existing = list.first()!;

  const inserted = list.insertAfter(existing, { i: 1 });

  expect(inserted.prev?.i).toBe(existing.i);
  expect(existing.next?.i).toBe(inserted.i);
});

test(`${LinkedList.name}.${LinkedList.prototype.insertAfter.name}: Updates existing next node`, () => {
  const list = new LinkedList([{ i: 0 }, { i: 1 }]);
  let existing = list.first()!;

  const inserted = list.insertAfter(existing, { i: 2 });
  
  const last = list.last();
  expect(last?.prev?.i).toBe(inserted.i);
  expect(inserted.next?.i).toBe(last?.i);
});

test(`${LinkedList.name}.${LinkedList.prototype.forEach.name}: Calls func once per element`, () => {
  const list = new LinkedList([{ i: 0 }, { i: 1 }, { i: 2 }]);

  let i = 0;

  list.forEach((node) => {
    expect(node.i).toBe(i);
    i++;
  });
});

test(`${LinkedList.name}.${LinkedList.prototype.map.name}: Calls func once per element and returns correct array`, () => {
  const list = new LinkedList([{ i: 0 }, { i: 1 }, { i: 2 }]);

  let i = 0;

  const array = list.map((node) => {
    expect(node.i).toBe(i);
    i++;
    return i - 1;
  });

  expect(array).toStrictEqual([0, 1, 2]);
});