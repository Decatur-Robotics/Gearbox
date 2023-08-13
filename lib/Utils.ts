import { Collections, GetDatabase } from "./MongoDB";

const db = GetDatabase();

export function CleanUsername(username: string): string {
    return username.replace(/\s/g, '').toLowerCase();
}

export async function GenerateSlug(collection: Collections, name: string, index:number=0): Promise<string> {
    var finalName;
    if(index === 0) {
        finalName = CleanUsername(name);
    } else {
        finalName = name + index.toString();
    }

    var result = await (await db).findObject(collection, {"slug":finalName});
    if(result) {
        return GenerateSlug(collection, index === 0 ? finalName : name, index+1);
    }

    return finalName;
}

export function RandomArrayValue(array: any[]): any {
    return array[Math.floor(Math.random()*array.length)]
}