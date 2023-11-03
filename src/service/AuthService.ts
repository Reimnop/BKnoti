import { StartupInfo } from "../data";
import { google } from "googleapis";
import { OAuth2Client } from "googleapis-common";
import { decodeBase64, encodeBase64, randomId } from "../util";
import express, { Express } from "express";
import { Logger } from "pino";
import { DatabaseService } from ".";
import { User } from "@prisma/client";

type AuthorizeRequest = {
    id: string;
    userId: string;
    oauth2Client: OAuth2Client;
}

type AuthorizeRequestState = {
    id: string;
}

export class AuthService {
    private readonly logger: Logger;
    private readonly startupInfo: StartupInfo;
    private readonly expressApp: Express;
    private readonly databaseService: DatabaseService;
    private readonly authorizeRequests: Map<string, AuthorizeRequest> = new Map();

    constructor(logger: Logger, databaseService: DatabaseService, startupInfo: StartupInfo) {
        this.logger = logger;
        this.databaseService = databaseService;
        this.startupInfo = startupInfo;

        // Start express server
        this.expressApp = this.initExpress();
        this.expressApp.listen(startupInfo.redirectPort);
    }
    
    private initExpress(): Express {
        const app = express();
        app.get("/authenticate", async (request, response) => {
            const queries = request.query;
            const state = queries.state;
            const code = queries.code;
            if (state && code && await this.handleAuthorizeRequest(state as string, code as string)) {
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

    private async handleAuthorizeRequest(state: string, code: string): Promise<boolean> {
        const stateObject = decodeBase64(state as string) as AuthorizeRequestState;
        const authorizeRequest = this.authorizeRequests.get(stateObject.id);
        if (!authorizeRequest)
            return false;
        this.authorizeRequests.delete(stateObject.id);

        const oauth2Client = authorizeRequest.oauth2Client;
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        if (!tokens.refresh_token)
            return false;
        
        // Add user to database
        const user: User = {
            discordId: authorizeRequest.userId,
            googleRefreshToken: tokens.refresh_token,
            calendar: null
        };
        await this.databaseService.addUser(user);

        return true;
    }

    getOauth2Client(refreshToken?: string): OAuth2Client {
        const client = new google.auth.OAuth2(
            this.startupInfo.googleApiClientId,
            this.startupInfo.googleApiClientSecret,
            this.startupInfo.googleApiRedirectUri
        );
        if (refreshToken) {
            client.setCredentials({
                refresh_token: refreshToken
            });
        }
        return client;
    }

    getAuthUrl(userId: string): string {
        // We request Google for an authorization URL
        // and return it to the user.
        const oauth2Client = this.getOauth2Client();
        const scopes = [
            "https://www.googleapis.com/auth/calendar.readonly"
        ];
        const id = randomId();
        const authorizeRequest: AuthorizeRequest = {
            id,
            userId,
            oauth2Client
        };
        const state: AuthorizeRequestState = {
            id
        };
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            state: encodeBase64(state)
        });
        this.authorizeRequests.set(id, authorizeRequest);
        return url;
    }
}