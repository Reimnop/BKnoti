import { StartupInfo } from "../data";
import { google } from "googleapis";
import { encodeBase64 } from "../util/EncodingHelper";
import express, { Express } from "express";

export class AuthService {
    private readonly startupInfo: StartupInfo;
    private readonly expressApp: Express;

    constructor(startupInfo: StartupInfo) {
        this.startupInfo = startupInfo;

        // Start express server
        this.expressApp = this.initExpress();
        this.expressApp.listen(startupInfo.redirectPort);
    }

    private initExpress(): Express {
        const app = express();
        app.get("/authenticate", (request, response) => {
            const queries = request.query;
            const state = queries.state;
            const code = queries.code;

            if (state && code) {
                console.log(queries);
                response.sendFile("assets/success.html", {
                    root: process.cwd()
                });
            } else {
                response.status(400).sendFile("assets/error.html", {
                    root: process.cwd()
                });
            }
        });
        app.use("/", express.static(`${process.cwd()}/assets/static`));
        return app;
    }

    getAuthUrl(userId: string): string {
        // We request Google for an authorization URL
        // and return it to the user.
        const oauth2Client = new google.auth.OAuth2(
            this.startupInfo.googleApiClientId,
            this.startupInfo.googleApiClientSecret,
            this.startupInfo.googleApiRedirectUri
        );
        const scopes = [
            "https://www.googleapis.com/auth/calendar.readonly"
        ];
        const state = {
            userId
        };
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            state: encodeBase64(state)
        });
        return url;
    }
}