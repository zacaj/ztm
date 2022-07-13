import { jsonParse, jsonStringify } from "./common";

describe('common', () => {
  describe('json', () => {
    it('should work', () => {
      const obj: any = {
        num: 1,
        str: 'str',
        date: new Date(1970, 1,1),
        a: {
          name: 'a',
        },
        b: {
          name: 'b',
        },
      };
      obj.obj = obj;
      obj.a2 = obj.a;

      const json = jsonStringify(obj);
      console.log(json);
      expect(json.includes('circular_3')).toBe(false);
      expect(json).toMatchSnapshot();
      const b = jsonParse(json);
      expect(b.num).toBe(1);
      expect(b.str).toBe('str');
      expect(typeof obj.date).not.toBe('string');
      expect(b.obj).toBe(b);
      expect(b.a.name).toBe('a');
      expect(b.a2).toBe(b.a);
    });
  });
});