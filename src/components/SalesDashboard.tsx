import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Phone,
  Flame,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../api.js';
import {
  Lead,
  DashboardMetrics,
  SourcePerformance,
  LeadSource,
  LeadTemperature,
} from '../types.js';

interface SalesDashboardProps {
  onSelectLead: (lead: Lead) => void;
  onOpenFactSheet: () => void;
  onOpenConcurrencyTest: () => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  onSelectLead,
  onOpenFactSheet,
  onOpenConcurrencyTest,
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [sourceData, setSourceData] = useState<SourcePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedTemp, setSelectedTemp] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'HOT' | 'VISITS' | 'HANDOFFS'>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, metricsRes, sourceRes] = await Promise.all([
        api.getLeads(),
        api.getDashboardMetrics(),
        api.getSourcePerformance(),
      ]);
      setLeads(leadsRes);
      setMetrics(metricsRes);
      setSourceData(sourceRes);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    // Quick Tabs
    if (activeTab === 'HOT' && lead.temperature !== 'HOT') return false;
    if (activeTab === 'VISITS' && lead.status !== 'VISIT_BOOKED' && lead.status !== 'VISITED') return false;
    if (activeTab === 'HANDOFFS' && lead.status !== 'HANDED_OFF') return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        lead.name.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.id.toLowerCase().includes(q) ||
        (lead.email && lead.email.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Source Filter
    if (selectedSource !== 'ALL' && lead.source !== selectedSource) return false;

    // Temperature Filter
    if (selectedTemp !== 'ALL' && lead.temperature !== selectedTemp) return false;

    // Status Filter
    if (selectedStatus !== 'ALL' && lead.status !== selectedStatus) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-bold text-slate-900 text-2xl tracking-tight">
              Sales Lead Management &amp; Analytics
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              Live Pipeline · Ahmedabad Team
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time lead qualification, automated site-visit conversion, and fact-sheet governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFactSheet}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            Edit Fact Sheet &amp; Slots
          </button>
          <button
            onClick={loadData}
            className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            Refresh Pipeline
          </button>
        </div>
      </div>

      {/* KPI Cards (Section 24 & 52) */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Target 1: Median First Response */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Median First Response</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-bold text-2xl text-slate-900 tabular-nums">
                {metrics.medianFirstResponseMinutes}m
              </span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Target &lt;5m
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Immediate AI qualification across WhatsApp &amp; portals
            </div>
          </div>

          {/* Target 2: Lead -> Site Visit Conversion */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Lead → Visit Rate</span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-bold text-2xl text-slate-900 tabular-nums">
                {metrics.leadToVisitConversion}%
              </span>
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                Target 8.0%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Baseline: {metrics.baselineConversion}% · 420 residences target
            </div>
          </div>

          {/* Target 3: Unreached in 48h */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Unreached in 48h</span>
              <AlertTriangle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-bold text-2xl text-slate-900 tabular-nums">
                {metrics.unreached48hPercent}%
              </span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Target &lt;5%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Zero lead dropoff via instant handoff routing
            </div>
          </div>

          {/* Target 4: Cost per Visit */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Cost Per Site Visit</span>
              <span className="font-mono text-xs text-slate-400">₹ CPL</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-bold text-2xl text-slate-900 tabular-nums">
                ₹{metrics.costPerVisit.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {metrics.totalVisits} visits
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Show-up rate: {metrics.showUpRate}%
            </div>
          </div>
        </div>
      )}

      {/* Source Performance Analytics (Section 23) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display font-semibold text-slate-900 text-lg">
              Source-Level Sales &amp; Visit Conversion Analytics
            </h2>
            <p className="text-xs text-slate-500">
              Sample monthly marketing spend: ₹30 Lakh · 3,000 monthly lead volume baseline.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Calculated Dynamically from Stored Lead Pipeline
          </div>
        </div>

        {/* Source Metrics Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sourceData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Bar dataKey="leads" name="Leads" fill="#0f172a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="visits" name="Site Visits" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Table (Section 23) */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-2.5 px-4">Source</th>
                <th className="py-2.5 px-4 text-right">Leads</th>
                <th className="py-2.5 px-4 text-right">Site Visits</th>
                <th className="py-2.5 px-4 text-right">Show-up Rate</th>
                <th className="py-2.5 px-4 text-right">Est. Monthly Cost</th>
                <th className="py-2.5 px-4 text-right">Cost / Visit</th>
                <th className="py-2.5 px-4 text-right">Median Resp.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {sourceData.map(row => (
                <tr key={row.source} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                    {row.label}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{row.leads}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900">
                    {row.visits}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-emerald-700">
                    {row.showUpRate}%
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-slate-600">
                    ₹{(row.monthlySpend / 100000).toFixed(1)}L
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900">
                    ₹{row.costPerVisit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-slate-500">
                    {row.medianResponseMinutes}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Leads Table Section (Section 20 & 26) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Quick Segmented Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Leads ({leads.length})
              </button>
              <button
                onClick={() => setActiveTab('HOT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'HOT'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Hot Leads ({leads.filter(l => l.temperature === 'HOT').length})
              </button>
              <button
                onClick={() => setActiveTab('VISITS')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'VISITS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Site Visits ({leads.filter(l => l.status === 'VISIT_BOOKED' || l.status === 'VISITED').length})
              </button>
              <button
                onClick={() => setActiveTab('HANDOFFS')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'HANDOFFS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Handoffs ({leads.filter(l => l.status === 'HANDED_OFF').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, lead ID..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 text-slate-900"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="ALL">All Sources</option>
              <option value="PROPERTY_PORTAL">Property Portal</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
              <option value="WEBSITE">Website</option>
              <option value="HOARDING">Hoarding Call</option>
              <option value="REFERRAL">Referral</option>
            </select>

            <select
              value={selectedTemp}
              onChange={e => setSelectedTemp(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="ALL">All Temperatures</option>
              <option value="HOT">HOT (70–100)</option>
              <option value="WARM">WARM (40–69)</option>
              <option value="COLD">COLD (0–39)</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="VISIT_BOOKED">Visit Booked</option>
              <option value="VISITED">Visited</option>
              <option value="HANDED_OFF">Handed Off</option>
              <option value="NO_SHOW">No Show</option>
            </select>

            {(selectedSource !== 'ALL' || selectedTemp !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedSource('ALL');
                  setSelectedTemp('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="text-amber-800 hover:underline text-xs ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Lead Table (Section 20) */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Lead ID</th>
                <th className="py-3 px-4">Buyer Name</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4">Visit Status</th>
                <th className="py-3 px-4">Assigned Executive</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No leads found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    {/* Lead ID + Duplicate Flag (Section 21) */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      <div>{lead.id}</div>
                      {lead.isDuplicate && (
                        <span className="inline-block text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 mt-0.5 font-sans">
                          Duplicate Match
                        </span>
                      )}
                    </td>

                    {/* Buyer Name & Phone */}
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      <div>{lead.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{lead.phone}</div>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {lead.source.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Requirement */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {lead.requirements.bedrooms ? `${lead.requirements.bedrooms} BHK` : '2/3 BHK'}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {lead.requirements.budgetDisplay || 'Budget pending'}
                      </div>
                    </td>

                    {/* Project */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {lead.matchedProjectId === 'proj-2'
                        ? 'The Serene Botanica'
                        : 'Aura Elysium'}
                    </td>

                    {/* AI Score & Temperature (Section 9) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-xs ${
                            lead.temperature === 'HOT'
                              ? 'text-amber-800'
                              : lead.temperature === 'WARM'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {lead.score}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            lead.temperature === 'HOT'
                              ? 'bg-amber-100 text-amber-800'
                              : lead.temperature === 'WARM'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {lead.temperature}
                        </span>
                      </div>
                    </td>

                    {/* Visit Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          lead.status === 'VISIT_BOOKED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : lead.status === 'VISITED'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : lead.status === 'NO_SHOW'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : lead.status === 'HANDED_OFF'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Assigned Executive */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {lead.assignedExecutiveName || 'Priya Shah'}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
