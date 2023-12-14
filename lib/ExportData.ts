import { GetDatabase, MongoDBInterface, Collections} from "./MongoDB";
import { ObjectId } from "mongodb";
import { Competition, Match, Team, CompetitonNameIdPair, MatchType, Alliance } from "./Types";

export namespace ExportData {
    export const CompetitionToCSV = async (compId: string) => {
        const db = await GetDatabase();
        const comp = await db.findObjectById<Competition>(Collections.Competitions, new ObjectId(compId));
        const reports = await db.findObjects<Report[]>(Collections.Reports, {"match": {"$in": comp.matches}, "submitted": true});
        
        var headers: string[] = ["id"];
        var lines: string[] = []
        reports[0].data.data.forEach(formElement => {
            headers.push(formElement.ref)
        });

        reports.forEach(report => {
            let line = `${report._id}`
            report.data.data.forEach(formElement => {
                line += `,${formElement.value}`
            });
            lines.push(line);
        });

        const finalString = headers.join(",") + "\n" + lines.join("\n");
        return finalString;
    }
}