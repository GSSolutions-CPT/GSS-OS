'use client'

import { useState } from 'react'
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Papa from 'papaparse'
import { inviteVisitorsBulk } from '../actions'

interface CSVRow {
    'Guest Name': string
    'Email'?: string
    'Access Date': string
    'Needs Parking': string
}

export function BulkUpload() {
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<CSVRow[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.')
            return
        }

        setFile(selectedFile)
        setError(null)
        setSuccessMessage(null)

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as CSVRow[]

                // Validate headers
                if (data.length > 0) {
                    const firstRow = data[0]
                    if (!firstRow.hasOwnProperty('Guest Name') || !firstRow.hasOwnProperty('Access Date')) {
                        setError('CSV must contain "Guest Name" and "Access Date" columns. Please download the template to ensure correct format.')
                        setParsedData([])
                        return
                    }
                }

                if (data.length > 50) {
                    setError('Maximum 50 guests per bulk upload to ensure API stability.')
                    setParsedData([])
                    return
                }

                setParsedData(data)
            },
            error: (err) => {
                setError(`Failed to parse CSV: ${err.message}`)
            }
        })
    }

    const handleBulkSubmit = async () => {
        if (parsedData.length === 0) return

        setIsUploading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            // Map parsed data into strong types array for the server action
            const payload = parsedData.map(row => ({
                name: row['Guest Name'],
                email: row['Email'] || '',
                date: row['Access Date'],
                needsParking: row['Needs Parking']?.toLowerCase() === 'true' || row['Needs Parking']?.toLowerCase() === 'yes'
            }))

            // Validate required fields client side
            const invalidRows = payload.filter(r => !r.name || !r.date)
            if (invalidRows.length > 0) {
                setError(`Found ${invalidRows.length} rows missing required Name or Access Date fields.`)
                setIsUploading(false)
                return
            }

            const res = await inviteVisitorsBulk(payload)

            if (res?.error) {
                setError(res.error)
            } else {
                setSuccessMessage(`Successfully generated and dispatched ${parsedData.length} credentials!`)
                setFile(null)
                setParsedData([])

                // Reset file input
                const fileInput = document.getElementById('csv-upload') as HTMLInputElement
                if (fileInput) fileInput.value = ''
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred during bulk upload.')
        } finally {
            setIsUploading(false)
        }
    }

    const downloadTemplate = () => {
        const headers = ["Guest Name", "Email", "Access Date", "Needs Parking\n"]
        const exampleRow = ["John Doe", "john@example.com", "2026-10-15", "true\n"]
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + exampleRow.join(',')

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "Nexus_Bulk_Invite_Template.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="relative z-10 w-full space-y-6">

            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
            )}

            {successMessage && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-green-500">{successMessage}</p>
                </div>
            )}

            <label className={`block border-2 border-dashed ${parsedData.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-secondary/20'} rounded-2xl p-12 text-center transition-colors cursor-pointer group`}>
                <Upload className={`h-10 w-10 mx-auto mb-4 transition-colors ${parsedData.length > 0 ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                <h3 className="font-semibold text-lg text-foreground">
                    {file ? file.name : 'Click to select CSV File'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                    {parsedData.length > 0
                        ? `Ready to process ${parsedData.length} invitations.`
                        : 'Upload a CSV containing Guest Name and Access Date to bulk generate up to 50 credentials.'}
                </p>
                <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border/40">
                <button
                    onClick={downloadTemplate}
                    type="button"
                    className="w-full sm:w-auto px-6 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-input/40 hover:bg-input/80 border border-border transition-colors"
                >
                    Download .CSV Template
                </button>

                <button
                    onClick={handleBulkSubmit}
                    disabled={isUploading || parsedData.length === 0}
                    className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(56,189,248,0.39)] hover:shadow-[0_6px_20px_rgba(56,189,248,0.23)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Processing...
                        </>
                    ) : (
                        `Generate ${parsedData.length > 0 ? parsedData.length : ''} Credentials`
                    )}
                </button>
            </div>
        </div>
    )
}
