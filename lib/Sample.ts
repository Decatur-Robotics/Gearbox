
import { ObjectId } from "mongodb";
import { GetDatabase, Collections } from "./MongoDB";
import { User } from "./Types";


async function getUser() {
    const db = await GetDatabase();
    const user = await db.findObjectById<User>(Collections.Users, new ObjectId(userId));
    console.log(user.name);
}