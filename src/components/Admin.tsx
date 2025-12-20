
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { formatDate, formatCurrency, getPetAvatarUrl } from '../utils/ui';
// Added CalendarCheck and Droplet to the imports
import { 
  Calendar as CalendarIcon, LayoutDashboard, ListTodo, User, Phone, 
  TrendingUp, DollarSign, Users, Activity, BarChart3, PieChart, Settings,
  ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle2, MoreHorizontal,
  CalendarCheck, Droplet
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
     const todayStr = new Date().toDateString();
     
     // 1. Today's Summary
     const todayApps = activeApps.filter(a => new Date(a.start_time).toDateString() === todayStr);
     const todayCompleted = todayApps.filter(a => a.status === 'completed').length;
     const todayPending = todayApps.filter(a => a.status === 'pending').length;
     const todayInProgress = todayApps.filter(a => a.status === 'in_progress').length;

     // 2. Revenue (Estimated based on price)
     const totalRevenue = activeApps.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
     
     // 3. Occupancy
     const totalMinutes = activeApps.reduce((acc, curr) => acc + (curr.services?.duration_minutes || 0), 0);
     const occupancyRate = Math.min(100, Math.round((totalMinutes / (40 * 60 * 4)) * 100));

     // 4. Ticket Average
     const ticketAvg = activeApps.length ? totalRevenue / activeApps.length : 0;

     // 5. Service Distribution
     const serviceCount: Record<string, number> = {};
     activeApps.forEach(a => {
        const name = a.services?.name || 'Outros';
        serviceCount[name] = (serviceCount[name] || 0) + 1;
     });
     const topServices = Object.entries(serviceCount)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({ name, count, pct: Math.round((count / activeApps.length) * 100) }));

     // 6. Weekly Volume
     const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
     const volumeByDay = new Array(7).fill(0);
     activeApps.forEach(a => {
        const day = new Date(a.start_time).getDay();
        volumeByDay[day]++;
     });
     const maxDaily = Math.max(...volumeByDay, 1);
     const chartData = weekDays.map((label, idx) => ({
         label,
         value: volumeByDay[idx],
         heightPct: (volumeByDay[idx] / maxDaily) * 100
     }));

     return { 
         totalRevenue, occupancyRate, ticketAvg, topServices, chartData, 
         totalCount: activeApps.length,
         todaySummary: {
             total: todayApps.length,
             completed: todayCompleted,
             pending: todayPending,
             inProgress: todayInProgress,
             list: todayApps.slice(0, 5)
         }
     };
  }, [appointments]);

  const DashboardView = () => (
      <div className="admin-grid-layout fade-in">
          
          {/* Top Row: KPIs */}
          <div className="kpi-row" style={{ gridColumn: '1 / -1' }}>
              <div className="kpi-card glass-morphism">
                  <div className="kpi-header">
                      <div className="kpi-icon bg-purple-soft"><DollarSign size={20}/></div>
                      <span className="kpi-trend trend-up"><TrendingUp size={14}/> +12%</span>
                  </div>
                  <div className="kpi-value">{formatCurrency(kpis.totalRevenue)}</div>
                  <div className="kpi-label">Receita Acumulada</div>
              </div>

              <div className="kpi-card glass-morphism">
                  <div className="kpi-header">
                      <div className="kpi-icon bg-cyan-soft"><Activity size={20}/></div>
                      <span className="kpi-trend trend-up"><TrendingUp size={14}/> Estável</span>
                  </div>
                  <div className="kpi-value">{kpis.occupancyRate}%</div>
                  <div className="kpi-label">Ocupação da Agenda</div>
              </div>

              <div className="kpi-card glass-morphism">
                  <div className="kpi-header">
                      <div className="kpi-icon bg-orange-soft"><Users size={20}/></div>
                  </div>
                  <div className="kpi-value">{formatCurrency(kpis.ticketAvg)}</div>
                  <div className="kpi-label">Ticket Médio</div>
              </div>

              <div className="kpi-card glass-morphism">
                  <div className="kpi-header">
                      <div className="kpi-icon bg-green-soft"><CheckCircle2 size={20}/></div>
                  </div>
                  <div className="kpi-value">{kpis.todaySummary.completed}/{kpis.todaySummary.total}</div>
                  <div className="kpi-label">Concluídos Hoje</div>
              </div>
          </div>

          {/* Today's Agenda Summary */}
          <div className="card admin-main-card reveal-on-scroll">
              <div className="card-header-flex">
                  <div>
                      <h3>Agenda de Hoje</h3>
                      <p className="text-muted text-sm">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setView('agenda')}>Ver Tudo</button>
              </div>
              
              <div className="today-agenda-list">
                  {kpis.todaySummary.list.length === 0 ? (
                      <div className="empty-state-small">Nenhum agendamento para hoje.</div>
                  ) : (
                      kpis.todaySummary.list.map(app => (
                          <div key={app.id} className="today-item">
                              <div className="today-time-slot">
                                  <strong>{new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                              </div>
                              <div className="today-pet-avatar">
                                  <img src={getPetAvatarUrl(app.pets?.name || '')} alt={app.pets?.name} />
                              </div>
                              <div className="today-info">
                                  <strong>{app.pets?.name}</strong>
                                  <span>{app.services?.name}</span>
                              </div>
                              <div className={`status-pill pill-${app.status}`}>
                                  {app.status === 'pending' ? 'Pendente' : app.status === 'in_progress' ? 'No Banho' : 'Confirmado'}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* Volume Weekly */}
          <div className="card admin-side-card reveal-on-scroll">
              <div className="card-header-flex">
                  <h3>Volume Semanal</h3>
                  <BarChart3 size={20} className="text-muted"/>
              </div>
              <div className="chart-container-compact">
                  {kpis.chartData.map((d, i) => (
                      <div key={i} className="chart-bar-group">
                          <div className="chart-bar-wrapper">
                             <div className="chart-bar-fill" style={{ height: `${d.heightPct}%` }}></div>
                          </div>
                          <span className="chart-label">{d.label}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Top Services */}
          <div className="card admin-side-card reveal-on-scroll">
              <div className="card-header-flex">
                  <h3>Mix de Serviços</h3>
                  <PieChart size={20} className="text-muted"/>
              </div>
              <div className="service-mix-list">
                  {kpis.topServices.map(s => (
                      <div key={s.name} className="service-mix-item">
                          <div className="mix-info">
                              <span>{s.name}</span>
                              <span className="mix-count">{s.count}</span>
                          </div>
                          <div className="mix-progress-bg">
                              <div className="mix-progress-fill" style={{ width: `${s.pct}%` }}></div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  const AgendaView = () => {
      const [currentDate, setCurrentDate] = useState(new Date());

      const getStartOfWeek = (date: Date) => {
          const d = new Date(date);
          const day = d.getDay();
          const diff = d.getDate() - day;
          return new Date(d.setDate(diff));
      };

      const startOfWeek = getStartOfWeek(currentDate);
      const weekDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(d.getDate() + i);
          return d;
      });
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8h to 18h
      const PIXELS_PER_HOUR = 60;

      const weekApps = appointments.filter(app => {
          const d = new Date(app.start_time);
          return d >= startOfWeek && d < new Date(endOfWeek.getTime() + 86400000);
      });

      return (
          <div className="agenda-view-container fade-in">
              <div className="calendar-header-modern">
                  <div className="calendar-nav">
                      <button className="btn-icon-sm" onClick={() => {
                          const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d);
                      }}><ChevronLeft size={20}/></button>
                      <h2 className="current-week-label">
                          {startOfWeek.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})} - {endOfWeek.toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'})}
                      </h2>
                      <button className="btn-icon-sm" onClick={() => {
                          const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d);
                      }}><ChevronRight size={20}/></button>
                  </div>
                  <div className="calendar-legend-modern">
                      <span className="legend-tag tag-pending">Pendente</span>
                      <span className="legend-tag tag-confirmed">Confirmado</span>
                      <span className="legend-tag tag-in_progress">No Banho</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>Hoje</button>
                  </div>
              </div>

              <div className="agenda-grid-scroll no-scrollbar">
                  <div className="agenda-grid">
                      <div className="agenda-time-column">
                          <div className="agenda-cell-header"><Clock size={14}/></div>
                          {hours.map(h => <div key={h} className="agenda-time-cell">{h}:00</div>)}
                      </div>
                      
                      {weekDays.map((day, i) => {
                          const isToday = day.toDateString() === new Date().toDateString();
                          const dayApps = weekApps.filter(a => new Date(a.start_time).toDateString() === day.toDateString());

                          return (
                              <div key={i} className={`agenda-day-column ${isToday ? 'agenda-today' : ''}`}>
                                  <div className="agenda-cell-header">
                                      <span className="day-name">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                      <span className="day-number">{day.getDate()}</span>
                                  </div>
                                  <div className="agenda-slots-area" style={{ height: hours.length * PIXELS_PER_HOUR }}>
                                      {hours.map(h => <div key={h} className="agenda-grid-line" style={{ height: PIXELS_PER_HOUR }}></div>)}
                                      
                                      {dayApps.map(app => {
                                          const start = new Date(app.start_time);
                                          const top = ((start.getHours() - 8) + (start.getMinutes() / 60)) * PIXELS_PER_HOUR;
                                          const height = ((app.services?.duration_minutes || 60) / 60) * PIXELS_PER_HOUR;

                                          return (
                                              <div 
                                                  key={app.id} 
                                                  className={`agenda-event app-status-${app.status}`}
                                                  style={{ top, height }}
                                                  onClick={() => {
                                                      const nextStatusMap: any = { 'pending': 'confirmed', 'confirmed': 'in_progress', 'in_progress': 'completed' };
                                                      const next = nextStatusMap[app.status];
                                                      if(next && confirm(`Avançar ${app.pets?.name} para ${next}?`)) updateStatus(app.id, next);
                                                  }}
                                              >
                                                  <div className="event-title">{app.pets?.name}</div>
                                                  <div className="event-subtitle">{app.services?.name}</div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  const KanbanView = () => (
     <div className="kanban-board-modern fade-in">
       <KanbanCol title="Pendentes" icon={<Clock size={16}/>} status="pending" items={appointments.filter(a => a.status === 'pending')} color="#F39C12" />
       <KanbanCol title="Confirmados" icon={<CalendarCheck size={16}/>} status="confirmed" items={appointments.filter(a => a.status === 'confirmed')} color="#2D3436" />
       <KanbanCol title="Em Atendimento" icon={<Droplet size={16}/>} status="in_progress" items={appointments.filter(a => a.status === 'in_progress')} color="#00CEC9" />
       <KanbanCol title="Finalizados" icon={<CheckCircle2 size={16}/>} status="completed" items={appointments.filter(a => a.status === 'completed')} color="#9B59B6" />
     </div>
  );

  const KanbanCol = ({ title, icon, status, items, color }: { title: string, icon: any, status: string, items: Appointment[], color: string }) => (
    <div className="kanban-column-modern">
      <div className="kanban-header-modern" style={{ borderTopColor: color }}>
        <div className="kanban-title-flex">
            {icon}
            <span>{title}</span>
        </div>
        <span className="kanban-count">{items.length}</span>
      </div>
      <div className="kanban-list no-scrollbar">
          {items.map(app => (
            <div key={app.id} className="kanban-card-modern reveal-on-scroll">
               <div className="kanban-card-top">
                 <img src={getPetAvatarUrl(app.pets?.name || '')} className="kanban-avatar" />
                 <div className="kanban-meta">
                    <div className="kanban-pet-name">{app.pets?.name}</div>
                    <div className="kanban-time">{new Date(app.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                 </div>
               </div>
               <div className="kanban-service-label">{app.services?.name}</div>
               <div className="kanban-client-row">
                  <User size={12}/> {app.profiles?.full_name?.split(' ')[0]}
               </div>
               <div className="kanban-actions-row">
                 {status === 'pending' && <button onClick={() => updateStatus(app.id, 'confirmed')} className="btn-action-kanban confirm">Aprovar</button>}
                 {status === 'confirmed' && <button onClick={() => updateStatus(app.id, 'in_progress')} className="btn-action-kanban start">Iniciar</button>}
                 {status === 'in_progress' && <button onClick={() => updateStatus(app.id, 'completed')} className="btn-action-kanban finish">Concluir</button>}
                 <button className="btn-action-kanban more"><MoreHorizontal size={14}/></button>
               </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="container admin-panel-page fade-in">
       <div className="admin-page-header">
          <div className="title-group">
            <h1>Painel Administrativo</h1>
            <p>Monitoramento em tempo real do Pet-S-PA</p>
          </div>
          <div className="admin-nav-tabs">
            <button className={`admin-tab ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
              <LayoutDashboard size={18}/> Dashboard
            </button>
            <button className={`admin-tab ${view === 'agenda' ? 'active' : ''}`} onClick={() => setView('agenda')}>
              <CalendarIcon size={18}/> Agenda
            </button>
            <button className={`admin-tab ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>
              <ListTodo size={18}/> Kanban
            </button>
            <button className={`admin-tab ${view === 'management' ? 'active' : ''}`} onClick={() => setView('management')}>
              <Settings size={18}/> Config
            </button>
          </div>
       </div>

       {loading ? (
         <div className="admin-loading-state">
            <div className="spinner"></div>
            <span>Sincronizando dados...</span>
         </div>
       ) : (
         <div className="admin-content-area">
           {view === 'dashboard' && <DashboardView />}
           {view === 'agenda' && <AgendaView />}
           {view === 'kanban' && <KanbanView />}
           {view === 'management' && <AdminManagement />}
         </div>
       )}
    </div>
  );
};
