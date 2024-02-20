import { exit } from "process"

import { autoRemoveJob } from "./cron"

const main = async () => {
  await autoRemoveJob()
  exit(0)
}

main()
