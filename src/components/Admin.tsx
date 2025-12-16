

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { formatDate, formatCurrency } from '../utils/ui';
import { 
  Calendar, LayoutDashboard, ListTodo, User, Phone, 
  TrendingUp, DollarSign, Users, Activity, BarChart3, PieChart, Settings
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { AdminManagement } from './AdminManagement';

export const AdminPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<'dashboard' | 'kanban' | 'agenda' | 'management'>('dashboard');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const apps = await api.admin.getAllAppointments();
      setAppointments(apps);
    } catch (e) { 
        console.error(e); 
        toast.error('Erro ao carregar dados');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: number, status: string) => {
     try {
        await api.admin.updateStatus(id, status);
        toast.success(`Status atualizado para ${status}`);
        fetchData();
     } catch (e) {
        toast.error('Erro ao atualizar status');
     }
  };

  // --- KPI & Data Calculation ---
  const kpis = useMemo(() => {
     const activeApps = appointments.filter(a => a.status !== 'cancelled');
     
     // 1. Revenue (Estimated based on price)
     const totalRevenue = activeApps.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
     
     // 2. Occupancy (Simplified: Total service minutes / (8h * 5 days * 4 weeks * slots)) - Mocking logic for demo
     const totalMinutes = activeApps.reduce((acc, curr) => acc + (curr.services?.duration_minutes || 0), 0);
     const occupancyRate = Math.min(100, Math.round((totalMinutes / (40 * 60 * 4)) * 100)); // Arbitrary capacity base

     // 3. Ticket Average
     const ticketAvg = activeApps.length ? totalRevenue / activeApps.length : 0;

     // 4. Service Distribution
     const serviceCount: Record<string, number> = {};
     activeApps.forEach(a => {
        const name = a.services?.name || 'Outros';
        serviceCount[name] = (serviceCount[name] || 0) + 1;
     });
     const topServices = Object.entries(serviceCount)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({ name, count, pct: Math.round((count / activeApps.length) * 100) }));

     // 5. Weekly Volume (By Day of Week)
     const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
     const volumeByDay = new Array(7).fill(0);
     activeApps.forEach(a => {
        const day = new Date(a.start_time).getDay();
        volumeByDay[day]++;
     });
     // Finding max for scaling chart
     const maxDaily = Math.max(...volumeByDay, 1);
     const chartData = weekDays.map((label, idx) => ({
         label,
         value: volumeByDay[idx],
         heightPct: (volumeByDay[idx] / maxDaily) * 100
     }));

     return { totalRevenue, occupancyRate, ticketAvg, topServices, chartData, totalCount: activeApps.length };
  }, [appointments]);

  // --- Views ---

  const DashboardView = () => (
      <div className="admin-grid-layout fade-in">
          
          {/* Top Row: KPIs */}
          <div className="kpi-row">
              <div className="kpi-card">
                  <div className="kpi-header">
                      <div className="kpi-icon"><DollarSign /></div>
                      <span className="kpi-trend trend-up"><TrendingUp size={14}/> +12%</span>
                  </div>
                  <div className="kpi-value">{formatCurrency(kpis.totalRevenue)}</div>
                  <div className="kpi-label">Receita Estimada</div>
              </div>

              <div className="kpi-card">
                  <div className="kpi-header">
                      <div className="kpi-icon"><Activity /></div>
                      <span className="kpi-trend trend-up"><TrendingUp size={14}/> Estável</span>
                  </div>
                  <div className="kpi-value">{kpis.occupancyRate}%</div>
                  <div className="kpi-label">Taxa de Ocupação</div>
              </div>

              <div className="kpi-card">
                  <div className="kpi-header">
                      <div className="kpi-icon"><Users /></div>
                  </div>
                  <div className="kpi-value">{formatCurrency(kpis.ticketAvg)}</div>
                  <div className="kpi-label">Ticket Médio</div>
              </div>
          </div>

          {/* Main Chart Column */}
          <div className="card" style={{ padding: 24 }}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                  <h3>Volume Semanal</h3>
                  <BarChart3 size={20} color="#999"/>
              </div>
              <div className="chart-container">
                  {kpis.chartData.map((d, i) => (
                      <div key={i} className="chart-bar-group">
                          <div className="chart-bar" style={{ height: `${d.heightPct}%` }}>
                              <span className="chart-bar-value">{d.value > 0 ? d.value : ''}</span>
                          </div>
                          <span className="chart-label">{d.label}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Side Column: Top Services */}
          <div className="card" style={{ padding: 24 }}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                  <h3>Top Serviços</h3>
                  <PieChart size={20} color="#999"/>
              </div>
              <div className="progress-list">
                  {kpis.topServices.map(s => (
                      <div key={s.name} className="progress-item">
                          <div className="progress-meta">
                              <span>{s.name}</span>
                              <span>{s.pct}%</span>
                          </div>
                          <div className="progress-track-bg">
                              <div className="progress-fill" style={{ width: `${s.pct}%` }}></div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="card" style={{ gridColumn: '1 / -1', padding: 0, overflow: 'hidden' }}>
               <div style={{ padding: '24px 24px 0' }}><h3>Últimas Transações</h3></div>
               <div className="table-wrapper" style={{ margin: 24 }}>
                   <table className="data-table">
                       <thead>
                           <tr>
                               <th>Data</th>
                               <th>Cliente</th>
                               <th>Pet</th>
                               <th>Serviço</th>
                               <th>Valor</th>
                               <th>Status</th>
                           </tr>
                       </thead>
                       <tbody>
                           {appointments.slice(0, 5).map(app => (
                               <tr key={app.id}>
                                   <td>{formatDate(app.start_time)}</td>
                                   <td>{app.profiles?.full_name}</td>
                                   <td>{app.pets?.name}</td>
                                   <td>{app.services?.name}</td>
                                   <td><strong>{formatCurrency(app.services?.price || 0)}</strong></td>
                                   <td><span className={`status-badge tag-${app.status}`}>{app.status}</span></td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
          </div>
      </div>
  );

  const AgendaView = () => {
      // Group by date, then sort by time
      const grouped: Record<string, Appointment[]> = {};
      appointments.forEach(app => {
          const dateKey = new Date(app.start_time).toLocaleDateString();
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(app);
      });
      const dates = Object.keys(grouped).sort(); // Basic sort

      return (
          <div className="agenda-container fade-in">
              {dates.length === 0 && <div className="empty-state text-center py-8">Nenhum agendamento encontrado.</div>}
              {dates.map(date => (
                  <div key={date} className="agenda-group">
                      <h4 className="agenda-date-header">{date}</h4>
                      <div className="agenda-list">
                          {grouped[date].map(app => (
                              <div key={app.id} className={`agenda-item border-left-${app.status}`}>
                                  <div className="agenda-time">
                                      {new Date(app.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                                  <div className="agenda-details">
                                      <div className="agenda-main-info">
                                          <strong>{app.pets?.name}</strong> 
                                          <span className="agenda-service"> • {app.services?.name}</span>
                                      </div>
                                      <div className="agenda-client-info">
                                          <User size={12} /> {app.profiles?.full_name} 
                                          {app.profiles?.phone && <span style={{marginLeft:8, opacity:0.7}}><Phone size={12}/> {app.profiles.phone}</span>}
                                      </div>
                                  </div>
                                  <div className="agenda-actions">
                                      <select 
                                          className="status-select-mini"
                                          value={app.status} 
                                          onChange={(e) => updateStatus(app.id, e.target.value)}
                                      >
                                          <option value="pending">Pendente</option>
                                          <option value="confirmed">Confirmado</option>
                                          <option value="in_progress">Em Andamento</option>
                                          <option value="completed">Concluído</option>
                                          <option value="cancelled">Cancelado</option>
                                      </select>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  const KanbanView = () => (
     <div className="kanban-board fade-in">
       <KanbanCol title="🟡 Solicitações" status="pending" items={appointments.filter(a => a.status === 'pending')} />
       <KanbanCol title="🟢 Agendados" status="confirmed" items={appointments.filter(a => a.status === 'confirmed')} />
       <KanbanCol title="🛁 No Banho" status="in_progress" items={appointments.filter(a => a.status === 'in_progress')} />
       <KanbanCol title="🏁 Concluídos" status="completed" items={appointments.filter(a => a.status === 'completed')} />
     </div>
  );

  const KanbanCol = ({ title, status, items }: { title: string, status: string, items: Appointment[] }) => (
    <div className="kanban-column">
      <div className="kanban-title">{title} ({items.length})</div>
      {items.map(app => (
        <div key={app.id} className={`kanban-card border-${app.status}`}>
           <div className="kanban-card-header">
             <div className="kanban-date">{formatDate(app.start_time)}</div>
           </div>
           <div className="kanban-pet-name">{app.pets?.name}</div>
           <div className="kanban-client-name">{app.profiles?.full_name}</div>
           <div className="kanban-service-tag">{app.services?.name}</div>
           <div className="kanban-actions" style={{ marginTop: 8 }}>
             {status === 'pending' && <button onClick={() => updateStatus(app.id, 'confirmed')} className="btn-pill-sm btn-action-positive">Aprovar</button>}
             {status === 'confirmed' && <button onClick={() => updateStatus(app.id, 'in_progress')} className="btn-pill-sm btn-action-positive">Iniciar</button>}
             {status === 'in_progress' && <button onClick={() => updateStatus(app.id, 'completed')} className="btn-pill-sm btn-action-positive">Finalizar</button>}
           </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container fade-in" style={{ paddingTop: 20 }}>
       <div className="admin-header">
         <div><h2>Painel de Controle</h2><span className="master-view-badge">CCO Operacional</span></div>
       </div>

       <div className="admin-tabs">
          <button className={`tab-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
              <LayoutDashboard size={16} style={{marginRight:6}}/> Visão Geral
          </button>
          <button className={`tab-btn ${view === 'agenda' ? 'active' : ''}`} onClick={() => setView('agenda')}>
              <Calendar size={16} style={{marginRight:6}}/> Agenda
          </button>
          <button className={`tab-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>
              <ListTodo size={16} style={{marginRight:6}}/> Fluxo (Kanban)
          </button>
          <button className={`tab-btn ${view === 'management' ? 'active' : ''}`} onClick={() => setView('management')}>
              <Settings size={16} style={{marginRight:6}}/> Gerenciar
          </button>
       </div>

       {loading ? <div className="spinner-center"><div className="spinner"></div></div> : (
         <>
           {view === 'agenda' && <AgendaView />}
           {view === 'kanban' && <KanbanView />}
           {view === 'dashboard' && <DashboardView />}
           {view === 'management' && <AdminManagement />}
         </>
       )}
    </div>
  );
};
