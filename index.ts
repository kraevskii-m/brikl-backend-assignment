import { startGateway } from './gateway'
import { startServer as startUserServer } from './services/user'
import { startServer as startTaskServer } from './services/task'

async function bootstrap() {
  await Promise.all([startUserServer(), startTaskServer()])

  await startGateway()
}

bootstrap()
