import { Dashboard } from './ui/Dashboard'

const app = document.getElementById('app')
if (!app) throw new Error('Missing #app element')

const dashboard = new Dashboard(app)
dashboard.init()
