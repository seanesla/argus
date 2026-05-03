import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function QuickLog() {
  const { meds, addDose, addSymptom } = useStore()
  const [openDose, setOpenDose] = useState(false)
  const [openSymptom, setOpenSymptom] = useState(false)
  const [selectedMedId, setSelectedMedId] = useState('')
  const [withFood, setWithFood] = useState(false)
  const [symptomName, setSymptomName] = useState('')
  const [severity, setSeverity] = useState(3)

  const handleAddDose = () => {
    if (selectedMedId) {
      addDose(selectedMedId, withFood, false)
      setSelectedMedId('')
      setWithFood(false)
      setOpenDose(false)
    }
  }

  const handleAddSymptom = () => {
    if (symptomName) {
      addSymptom(symptomName.toLowerCase(), severity as 1 | 2 | 3 | 4 | 5)
      setSymptomName('')
      setSeverity(3)
      setOpenSymptom(false)
    }
  }

  return (
    <div className="flex gap-4">
      {/* Log dose */}
      <Dialog open={openDose} onOpenChange={setOpenDose}>
        <DialogTrigger asChild>
          <Button variant="default">Log Dose</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a Medication Dose</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="med">Medication</Label>
              <select
                id="med"
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                className="w-full rounded border border-input px-3 py-2"
              >
                <option value="">Select a medication</option>
                {meds.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.dosage}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="withFood"
                checked={withFood}
                onChange={(e) => setWithFood(e.target.checked)}
              />
              <Label htmlFor="withFood">Taken with food</Label>
            </div>
            <Button onClick={handleAddDose} className="w-full">
              Log Dose
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log symptom */}
      <Dialog open={openSymptom} onOpenChange={setOpenSymptom}>
        <DialogTrigger asChild>
          <Button variant="outline">Log Symptom</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a Symptom</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="symptom">Symptom</Label>
              <Input
                id="symptom"
                value={symptomName}
                onChange={(e) => setSymptomName(e.target.value)}
                placeholder="e.g., headache, nausea"
              />
            </div>
            <div>
              <Label>Severity: {severity}</Label>
              <Slider
                value={[severity]}
                onValueChange={(v) => setSeverity(v[0])}
                min={1}
                max={5}
                step={1}
              />
            </div>
            <Button onClick={handleAddSymptom} className="w-full">
              Log Symptom
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
