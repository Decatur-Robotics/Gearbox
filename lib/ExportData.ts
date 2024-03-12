
import {GetDatabase, MongoDBInterface, Collections} from "./MongoDB";
import { ObjectId } from "mongodb";
import { FormData } from "./Types";
import { Competition } from "./Types";
const dbq = GetDatabase();
export namespace ExportData {
    export const CompetitionToCSV = async (compId: string) => {
        
        const db = await dbq;
        const comp = await db.findObjectById<Competition>(Collections.Competitions, new ObjectId(compId));
        const reports = await db.findObjects<Report[]>(Collections.Reports, {"match": {"$in": comp.matches}, "submitted": true});
        let keys = Object.keys(FormData);

        var csv = "";
        csv += keys.join(",");

        console.log(csv)
      
    }
}