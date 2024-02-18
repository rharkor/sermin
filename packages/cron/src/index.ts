import { CronJob } from "cron"

import sampleCron from "./sample/cron"

//* Sync last connection of users
new CronJob(
  //? Every 3 minutes
  "*/3 * * * *",
  sampleCron,
  null,
  true,
  "Europe/Paris"
)
