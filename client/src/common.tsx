import React, {ReactNode, useEffect, useState} from "react";
import styled from "styled-components";

export const Button = styled.button.attrs(props => ({
  type: props.type ?? 'button',
}))`
  outline: none;
  background: #EEE;
  border: 1px solid grey;
  border-radius: 3px;
  padding: 2px 4px;
  cursor: pointer;
`;

export const Label = styled.label`
`;

export const Input = styled.input.attrs({
  type: 'text',
})`
  border: 1px solid lightgrey;
  border-radius: 3px;
`;
export const FormGrid = styled.form`
  display: grid;
  grid-column-template: auto auto;
  row-gap: 8px;
  column-gap: 10px;
`;

export function getAllPropertyNames (obj: any) {
  const proto     = Object.getPrototypeOf(obj);
  if (!proto) return [];
  const inherited: any = (proto) ? getAllPropertyNames(proto) : [];
  return [...new Set(Object.getOwnPropertyNames(obj).concat(inherited))];
}
export function removeCircular(o: any, seen = new Map<any, [number, any]>()): any {
  if (Array.isArray(o)) return o.map(e => removeCircular(e, seen));
  if (typeof o !== 'object' || Object.getPrototypeOf(o) !== Object.prototype) return o;
  if (seen.has(o)) {
    const [num, u] = seen.get(o)!;
    u._circular ??= num;
    return 'circular_'+u._circular;
  }
  const u: any = {};
  seen.set(o, [seen.size+1, u]);
  for (const key of getAllPropertyNames(o) as any) {
    u[key] = removeCircular(o[key], seen);
  }
  return u;
}
export function addCircular(o: any, seen = new Map<number, any>()): any {
  if (Array.isArray(o)) return o.map(e => addCircular(e, seen));
  if (typeof o === 'string' && o.startsWith('circular_'))
    return seen.get(parseInt(o.substr('circular_'.length), 10)) ?? `unresolved circular reference: '${o}'`;
  if (typeof o !== 'object') return o;
  if ('_circular' in o) {
    seen.set(o._circular, o);
    delete o._circular;
  }
  for (const key of getAllPropertyNames(o) as any) {
    o[key] = addCircular(o[key], seen);
  }
  return o;
}
export function jsonStringify(obj: any) {
  // const objs = new Map<any, number>();
  // function proc(orig: any) {
  //   const o
  //   objs.set(o, objs.size);
  //   for (const key of Object.keys(o)) {
  //     if (typeof o[key] !== 'object')
  //   }
  // }
  return JSON.stringify(removeCircular(obj), null, 2);
}

export function jsonParse(str: string) {
  const reDateDetect = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;  // startswith: 2015-04-29T22:06:55
  return addCircular(JSON.parse(str, (key: any, value: any) => {
    if (typeof value === 'string' && (reDateDetect.exec(value))) {
        return new Date(value);
    }
    return value;
  })); 
}

declare global {
  interface Array<T> {
      remove(...elems: T[]): Array<T>;
      clear(): Array<T>;
      unique(): Array<T>;
      set(arr: T[]): Array<T>;
      last(): T|undefined;
      minus(...elems: T[]): Array<T>;
      shuffle(rand?: () => number, times?: number): this;
      take(num: number, rand?: () => number): T[];
      rand(rand?: () => number): T;
      truthy(): Array<NonNullable<T>>;
  }
}

Array.prototype.remove = function<T>(this: T[], ...elems: T[]): T[] {
  for (const element of elems) {
      let index: number;
      while ((index = this.indexOf(element)) !== -1) {
          this.splice(index, 1);
      }
  }
  return this;
};
Array.prototype.clear = function<T>(this: T[]): T[] {
  this.splice(0, this.length);
  return this;
};
Array.prototype.unique = function<T>(this: T[]): T[] {
  return [...new Set<T>(this)];
};
Array.prototype.set = function<T>(this: T[], that: T[]): T[] {
  this.splice(0, this.length, ...that);
  return this;
};
Array.prototype.last = function<T>(this: T[]): T|undefined {
  return this[this.length - 1];
};
Array.prototype.minus = function<T>(this: T[], ...elems: T[]): T[] {
  const arr = this.slice();
  return arr.remove(...elems);
};
Array.prototype.shuffle = function<T>(this: T[], rand: () => number = () => Math.random(), times = 3): T[] {
  for (let k=0; k<times; k++) {
      for (let i = this.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [this[i], this[j]] = [this[j], this[i]];
      }
  }
  return this;
};
Array.prototype.truthy = function<T>(this: T[]): NonNullable<T>[] {
  return this.filter(x => !!x) as any;
};

Array.prototype.rand = function<T>(this: T[], rand: () => number = () => Math.random()): T {
  const j = Math.floor(rand() * this.length);
  return this[j];
};

Array.prototype.take = function<T>(this: T[], num: number, rand: () => number = () => Math.random()): T[] {
  const ret: T[] = [];
  for (let i=0; i<num; i++) {
    const t = this.rand(rand);
    this.remove(t);
    ret.push(t);
  }
  return ret;
};