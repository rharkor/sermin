import { autoRemoveJob } from "./cron"

const main = async () => {
  await autoRemoveJob()
}

main()
