import { Settings } from 'lucide-react'
import { getBuildingSettings } from './actions'
import SettingsForm from './SettingsForm'

export default async function BuildingSettingsPage() {
    const settings = await getBuildingSettings()

    const defaultSettings = {
        house_rules: '1. No noise after 10PM. 2. No littering in common areas. 3. Residents responsible for guest behaviour.',
        wifi_ssid: '35OnRose_Guest_WiFi',
        wifi_password: 'rose-security-gss',
        check_in_time: '14:00',
        check_out_time: '10:00'
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                    Building Global Settings
                </h1>
                <p className="text-muted-foreground mt-2">
                    Update house rules, Wi-Fi credentials, and stay policies for the dynamic Guest Guidebook.
                </p>
            </div>

            <SettingsForm initialSettings={settings || defaultSettings} />
        </div>
    )
}
