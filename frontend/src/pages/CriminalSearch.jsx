import { useState } from 'react'
import { ShieldAlert, Search, User, FileText, Phone, KeyRound, MapPin, AlertCircle } from 'lucide-react'
import api from '../api/client.js'

export default function CriminalSearch() {
  const [filters, setFilters] = useState({
    name: '',
    aadhaar: '',
    phone: '',
    vehicle_number: '',
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true)
    setSelectedRecord(null)
    try {
      const activeFilters = {}
      if (filters.name) activeFilters.name = filters.name
      if (filters.aadhaar) activeFilters.aadhaar = filters.aadhaar
      if (filters.phone) activeFilters.phone = filters.phone
      if (filters.vehicle_number) activeFilters.vehicle_number = filters.vehicle_number

      const res = await api.get('/criminals/search', { params: activeFilters })
      setResults(res.data)
      setSearched(true)
      if (res.data.length > 0) {
        setSelectedRecord(res.data[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 min-h-screen text-slate-100">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-white mb-1 uppercase tracking-wide flex items-center gap-2">
          <ShieldAlert className="text-signal-amber" /> Criminal Database Search
        </h1>
        <p className="text-slate-400 text-sm">Query criminal dossiers across the command network using identifiers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search Panel */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSearch} className="bg-ink-900 border border-ink-700 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Search Filters</h2>
            
            <div>
              <label className="text-xs text-slate-400 block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={filters.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh"
                  className="w-full pl-9 pr-4 py-2 rounded bg-ink-800 border border-ink-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-signal-amber"
                />
                <User className="absolute left-3 top-2.5 text-slate-500" size={16} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Aadhaar (Demo)</label>
              <div className="relative">
                <input
                  type="text"
                  name="aadhaar"
                  value={filters.aadhaar}
                  onChange={handleChange}
                  placeholder="e.g. XXXX XXXX 1001"
                  className="w-full pl-9 pr-4 py-2 rounded bg-ink-800 border border-ink-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-signal-amber"
                />
                <KeyRound className="absolute left-3 top-2.5 text-slate-500" size={16} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  value={filters.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9848022338"
                  className="w-full pl-9 pr-4 py-2 rounded bg-ink-800 border border-ink-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-signal-amber"
                />
                <Phone className="absolute left-3 top-2.5 text-slate-500" size={16} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Associated Vehicle Number</label>
              <div className="relative">
                <input
                  type="text"
                  name="vehicle_number"
                  value={filters.vehicle_number}
                  onChange={handleChange}
                  placeholder="e.g. TS09AB1001"
                  className="w-full pl-9 pr-4 py-2 rounded bg-ink-800 border border-ink-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-signal-amber"
                />
                <FileText className="absolute left-3 top-2.5 text-slate-500" size={16} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (!filters.name && !filters.aadhaar && !filters.phone && !filters.vehicle_number)}
              className="w-full bg-signal-amber hover:bg-signal-amberDim disabled:opacity-50 text-ink-950 font-bold py-2.5 rounded transition-all duration-150 flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
            >
              <Search size={16} />
              {loading ? 'Searching...' : 'Run Query'}
            </button>
          </form>

          {/* Results List */}
          {searched && (
            <div className="bg-ink-900 border border-ink-700 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Matches ({results.length})</h2>
              {results.length === 0 ? (
                <p className="text-slate-400 text-sm">No criminal records match your search criteria.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {results.map((record) => (
                    <button
                      key={record.criminal_id}
                      onClick={() => setSelectedRecord(record)}
                      className={`w-full text-left p-3 rounded border transition-all flex items-center justify-between ${
                        selectedRecord?.criminal_id === record.criminal_id
                          ? 'bg-ink-800 border-signal-amber text-white'
                          : 'bg-ink-950 border-ink-700 text-slate-300 hover:bg-ink-800'
                      }`}
                    >
                      <div>
                        <p className="font-display font-medium text-sm">{record.name}</p>
                        <p className="text-xs text-slate-500">{record.criminal_id} | Phone: {record.phone || 'N/A'}</p>
                      </div>
                      <span
                        className={`text-2xs px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          record.status === 'Active'
                            ? 'bg-signal-red/10 text-signal-red border border-signal-red/20'
                            : 'bg-signal-green/10 text-signal-green border border-signal-green/20'
                        }`}
                      >
                        {record.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Details Dossier */}
        <div className="lg:col-span-2">
          {selectedRecord ? (
            <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden shadow-xl">
              {/* Dossier Header */}
              <div className="bg-ink-800 border-b border-ink-700 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-ink-750 border border-ink-600 rounded-full flex items-center justify-center text-signal-amber font-display font-bold text-lg">
                    {selectedRecord.name[0]}
                  </div>
                  <div>
                    <h2 className="font-display text-lg text-white font-bold tracking-wide">{selectedRecord.name}</h2>
                    <p className="text-xs text-slate-400">File Reference: {selectedRecord.criminal_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
                      selectedRecord.status === 'Active'
                        ? 'bg-signal-red/20 text-signal-red border border-signal-red/30 animate-pulse'
                        : 'bg-signal-green/20 text-signal-green border border-signal-green/30'
                    }`}
                  >
                    {selectedRecord.status} Dossier
                  </span>
                </div>
              </div>

              {/* Dossier Body */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <DossierItem label="Age" value={`${selectedRecord.age} years`} />
                  <DossierItem label="Gender" value={selectedRecord.gender || 'N/A'} />
                  <DossierItem label="Aadhaar" value={selectedRecord.aadhaar || 'N/A'} />
                  <DossierItem label="Phone" value={selectedRecord.phone || 'N/A'} />
                </div>

                <div className="border-t border-ink-750 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <MapPin className="text-slate-500 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Registered District</p>
                      <p className="text-sm text-slate-200 mt-0.5">{selectedRecord.district || 'GVAK Command Zone'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="text-slate-500 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Resident Address</p>
                      <p className="text-sm text-slate-200 mt-0.5">{selectedRecord.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* History Dossier Card */}
                <div className="border-t border-ink-750 pt-6">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-signal-amber" /> Criminal Background & Arrest Log
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-ink-950 border border-ink-750 p-4 rounded-md">
                      <p className="text-xs text-slate-500 font-semibold">PREVIOUS FIRs</p>
                      <p className="font-display text-2xl font-bold text-white mt-1">
                        {selectedRecord.previous_firs} cases
                      </p>
                    </div>
                    <div className="bg-ink-950 border border-ink-750 p-4 rounded-md">
                      <p className="text-xs text-slate-500 font-semibold">ARREST HISTORY</p>
                      <p className="font-display text-2xl font-bold text-white mt-1">
                        {selectedRecord.arrest_history || 'No history logged'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-ink-900 border border-ink-700 rounded-lg p-10 flex flex-col items-center justify-center text-center h-full min-h-[350px]">
              <ShieldAlert className="text-ink-600 mb-4" size={48} />
              <h3 className="font-display text-lg text-slate-300 font-bold mb-2">No Dossier Selected</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Enter search parameters and select a record to display full police verification dossier details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DossierItem({ label, value }) {
  return (
    <div className="bg-ink-950 border border-ink-750 p-3 rounded">
      <p className="text-slate-500 text-2xs uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-white font-medium text-sm mt-0.5">{value}</p>
    </div>
  )
}
