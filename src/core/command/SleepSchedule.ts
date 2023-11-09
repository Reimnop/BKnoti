import { ChatInputCommandInteraction, CacheType, EmbedBuilder, range } from "discord.js";
import { Command } from "..";
import { AuthService, DatabaseService } from "../../service";
import { google, calendar_v3 } from "googleapis";
import { DateTime, Zone } from "luxon";
import { CALENDAR_NOT_SET, ERROR_OCCURRED, NOT_AUTHORIZED } from "../../util";

export class SleepSchedule implements Command {
    private readonly authService: AuthService;
    private readonly databaseService: DatabaseService;

    constructor(authService: AuthService, databaseService: DatabaseService) {
        this.authService = authService;
        this.databaseService = databaseService;
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const user = await this.databaseService.getUser(interaction.user.id);
        if (!user) {
            await interaction.editReply(NOT_AUTHORIZED);
            return;
        }
        if (!user.calendar) {
            await interaction.editReply(CALENDAR_NOT_SET);
            return;
        }
        const oauth2Client = this.authService.getOAuth2Client(user.googleRefreshToken);
        const calendarClient = google.calendar({
            version: "v3",
            auth: oauth2Client
        });

        // Get user timezone from Google Calendar
        const calendarSettingsResponse = await calendarClient.settings.get({
            setting: "timezone"
        });
        if (calendarSettingsResponse.status !== 200) {
            await interaction.editReply(ERROR_OCCURRED);
            return;
        }
        const timezone = calendarSettingsResponse.data.value!;
        
        // Calculate sleep time
        const now = DateTime.now().setZone(timezone);
        const tomorrow = now.plus({ days: 1 }).startOf("day");
        const overmorrow = tomorrow.plus({ days: 1 });
        const calendarEventsResponse = await calendarClient.events.list({
            calendarId: user.calendar,
            orderBy: "startTime",
            singleEvents: true,
            timeMin: tomorrow.toISO()!,
            timeMax: overmorrow.toISO()!
        });
        if (calendarEventsResponse.status !== 200) {
            await interaction.editReply(ERROR_OCCURRED);
            return;
        }
        const events = calendarEventsResponse.data;
        const wakeUpTime = this.calculateWakeUpTime(tomorrow, events, timezone);
        const wakeUpTimeUnix = wakeUpTime.toSeconds();

        const embed = new EmbedBuilder()
            .setColor(0x5dff5d)
            .setTitle("You should go to bed at...")
            .setDescription(
                [...range(8)]
                .map(cycleIndex => {
                    const cycle = cycleIndex + 1;
                    const sleepTime = this.calculateSleepTime(wakeUpTime, cycle);
                    const sleepTimeUnix = sleepTime.toSeconds();
                    return `**Cycle ${cycle}**: <t:${sleepTimeUnix}:t>`;
                })
                .join("\n"));

        await interaction.editReply({
            content: `To wake up at <t:${wakeUpTimeUnix}:t>,`,
            embeds: [embed]
        });
    }
    
    private calculateWakeUpTime(day: DateTime, events: calendar_v3.Schema$Events, timezone: string): DateTime {
        // Get first event
        const firstEvent = events.items?.[0];
        const firstEventStart = firstEvent ? DateTime.fromISO(firstEvent.start?.dateTime!).setZone(timezone) : undefined;
        if (firstEventStart && firstEventStart.hour < 9) {
            return firstEventStart.minus({ hours: 1});
        }
        return day.plus({ hours: 9 });
    }

    // Calculate sleep time based on sleep cycles
    private calculateSleepTime(wakeUpTime: DateTime, cycles: number) {
        const cycleLength = 90;
        const sleepTime = wakeUpTime.minus({ minutes: cycles * cycleLength });
        return sleepTime;
    }
}