import { autoRemove } from "./autoremove/cron"
import { fetchDbBackups } from "./dbackup/cron"

const main = () => {
  setInterval(fetchDbBackups, 1000 * 60)
  fetchDbBackups()
  autoRemove()
}

main()
