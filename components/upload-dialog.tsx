'use client'

import { useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadDialogProps {
  folderId: number | null
  landId: string
  onUploadSuccess?: () => void
}

function formatTwoDigitInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 2)
}

function getClockHourValue(clockValue: string) {
  return clockValue.split(':')[0] ?? ''
}

function getClockMinuteValue(clockValue: string) {
  return clockValue.split(':')[1] ?? ''
}

function mergeClockInputValue(clockValue: string, part: 'hour' | 'minute', value: string) {
  const hourValue = part === 'hour' ? formatTwoDigitInput(value) : getClockHourValue(clockValue)
  const minuteValue = part === 'minute' ? formatTwoDigitInput(value) : getClockMinuteValue(clockValue)

  if (!hourValue && !minuteValue) return ''

  return `${hourValue}:${minuteValue}`
}

export function UploadDialog({
  folderId,
  landId,
  onUploadSuccess
}: UploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [targetClock, setTargetClock] = useState('')
  const [error, setError] = useState('')

  const isValidTargetClock = /^([01]\d|2[0-3]):[0-5]\d$/.test(targetClock)
  const isTargetTimeValid = (!targetDate && !targetClock) || (Boolean(targetDate) && isValidTargetClock)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Limit file size to 50MB
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!file || !title) {
      setError('Please provide a title and select a file')
      return
    }

    if ((targetDate || targetClock) && (!targetDate || !isValidTargetClock)) {
      setError('Target waktu harus diisi dengan tanggal dan jam format 24 jam, contoh 14:30')
      return
    }

    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('landId', landId)
      if (targetDate && isValidTargetClock) {
        formData.append('targetTime', new Date(`${targetDate}T${targetClock}`).toISOString())
      }
      if (folderId !== null) {
        formData.append('folderId', folderId.toString())
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      // Reset form
      setFile(null)
      setTitle('')
      setDescription('')
      setTargetDate('')
      setTargetClock('')
      setIsOpen(false)

      // Call callback
      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto flex items-center justify-center"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Document
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Document
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., SOP Customer Service"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of the document"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Waktu
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    disabled={isLoading}
                  />
                  <div className="flex h-10 items-center rounded-lg border border-gray-300 bg-white px-2 text-gray-900 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
                    <input
                      type="text"
                      value={getClockHourValue(targetClock)}
                      onChange={(e) => setTargetClock((currentValue) =>
                        mergeClockInputValue(currentValue, 'hour', e.target.value)
                      )}
                      placeholder="HH"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      aria-label="Jam"
                      className="h-full w-10 bg-transparent text-center outline-none placeholder:text-gray-400"
                      disabled={isLoading}
                    />
                    <span className="px-1 font-semibold text-gray-500">:</span>
                    <input
                      type="text"
                      value={getClockMinuteValue(targetClock)}
                      onChange={(e) => setTargetClock((currentValue) =>
                        mergeClockInputValue(currentValue, 'minute', e.target.value)
                      )}
                      placeholder="MM"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      aria-label="Menit"
                      className="h-full w-10 bg-transparent text-center outline-none placeholder:text-gray-400"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                    disabled={isLoading}
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    {file ? (
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Click to select a file</p>
                        <p className="text-gray-500">or drag and drop</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !file || !title || !isTargetTimeValid}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
