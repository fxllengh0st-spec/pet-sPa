
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { formatDate, formatCurrency, getPetAvatarUrl } from '../utils/ui';
import { 
  Calendar as CalendarIcon, LayoutDashboard, ListTodo, User, Phone, 
  TrendingUp, DollarSign, Users, Activity, BarChart3, Settings,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, MoreHorizontal,
  CalendarCheck, Droplet, Filter, ArrowUpRight, CalendarDays, CalendarRange
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { AdminManagement } from './AdminManagement';

type TimeFilter = 'day' | 'week' | 'month';

export const AdminPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<'dashboard' | 'kanban' | 'agenda' | 'management'>('dashboard');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const apps = await api.admin.getAllAppointments();
      setAppointments(apps);
    } catch (e) { 
        console.error(e); 
        toast.error('Erro ao sincronizar dados');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: number, status: string) => {
     try {
        await api.admin.updateStatus(id, status);
        toast.success(`Status: ${status}`);
        fetchData();
     } catch (e) {
        toast.error('Erro ao atualizar');
     }
  };

  // --- RECTIVE BUSINESS INTELLIGENCE ---
  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return appointments.filter(a => {
        const appDate = new Date(a.start_time);
        if (timeFilter === 'day') {
            return appDate.toDateString() === now.toDateString();
        } else if (timeFilter === 'week') {
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            return appDate >= startOfWeek && appDate < endOfWeek;
        } else {
            return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
        }
    });
  }, [appointments, timeFilter]);

  const stats = useMemo(() => {
     const activeApps = filteredData.filter(a => a.status !== 'cancelled');
     const revenue = activeApps.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
     const occupancy = Math.min(100, Math.round((activeApps.length / (timeFilter === 'day' ? 15 : timeFilter === 'week' ? 80 : 300)) * 100));
     
     // Chart logic adapts to filter
     let chartData = [];
     if (timeFilter === 'day') {
         const hours = ['09h', '11h', '13h', '15h', '17h'];
         chartData = hours.map(h => ({ label: h, val: Math.random() * 10, h: Math.random() * 100 }));
     } else {
         const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
         const volume = new Array(7).fill(0);
         activeApps.forEach(a => volume[new Date(a.start_time).getDay()]++);
         const maxVol = Math.max(...volume, 1);
         chartData = days.map((label, i) => ({ label, val: volume[i], h: (volume[i]/maxVol)*100 }));
     }

     return { revenue, occupancy, chart: chartData, total: activeApps.length };
  }, [filteredData, timeFilter]);

  const DashboardView = () => (
      <div className="admin-dashboard-v2 fade-in">
          {/* KPI ROW */}
          <div className="admin-kpi-grid">
              <div className="admin-kpi-card purple">
                  <div className="kpi-header">
                      <div className="kpi-icon-circle"><DollarSign size={20}/></div>
                      <div className="kpi-trend"><ArrowUpRight size={14}/> {timeFilter === 'day' ? '+5%' : '+12%'}</div>
                  </div>
                  <div className="kpi-info">
                      <span className="kpi-label">Receita no Período</span>
                      <h2 className="kpi-value">{formatCurrency(stats.revenue)}</h2>
                  </div>
                  <div className="kpi-mini-chart">
                      {stats.chart.map((d, i) => <div key={i} className="bar" style={{height: `${d.h}%`}}></div>)}
                  </div>
              </div>

              <div className="admin-kpi-card cyan">
                  <div className="kpi-header">
                      <div className="kpi-icon-circle"><Activity size={20}/></div>
                      <div className="kpi-trend">Meta</div>
                  </div>
                  <div className="kpi-info">
                      <span className="kpi-label">Ocupação Médio</span>
                      <h2 className="kpi-value">{stats.occupancy}%</h2>
                  </div>
                  <div className="progress-track-kpi"><div className="fill" style={{width: `${stats.occupancy}%`}}></div></div>
              </div>

              <div className="admin-kpi-card orange">
                  <div className="kpi-header">
                      <div className="kpi-icon-circle"><Users size={20}/></div>
                  </div>
                  <div className="kpi-info">
                      <span className="kpi-label">Total de Atendimentos</span>
                      <h2 className="kpi-value">{stats.total}</h2>
                  </div>
              </div>
          </div>

          <div className="admin-two-col-grid">
              {/* CURRENT FILTER LIST */}
              <div className="card admin-list-card">
                  <div className="card-header-flex">
                      <h3>{timeFilter === 'day' ? 'Fila de Hoje' : timeFilter === 'week' ? 'Programação Semanal' : 'Visão Mensal'}</h3>
                      <span className="tag-pill">{filteredData.length} itens</span>
                  </div>
                  <div className="admin-today-list">
                      {filteredData.length === 0 ? (
                          <div className="empty-state-tiny">Nenhum agendamento encontrado para este período.</div>
                      ) : (
                          filteredData.map(app => (
                              <div key={app.id} className="admin-today-item">
                                  <div className="item-time">{new Date(app.start_time).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</div>
                                  <img src={getPetAvatarUrl(app.pets?.name || '')} className="item-avatar" />
                                  <div className="item-info">
                                      <strong>{app.pets?.name}</strong>
                                      <span>{app.services?.name}</span>
                                  </div>
                                  <div className={`status-pill pill-${app.status}`}>{app.status}</div>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              {/* DYNAMIC CHART */}
              <div className="card admin-chart-card">
                  <h3>Volume de Demanda</h3>
                  <div className="admin-main-chart">
                      {stats.chart.map((d, i) => (
                          <div key={i} className="chart-col">
                              <div className="chart-bar-bg"><div className="chart-bar-fill" style={{height: `${d.h}%`}}></div></div>
                              <span>{d.label}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  const KanbanView = () => (
      <div className="admin-kanban-board fade-in">
          <KanbanColumn title="Pendente" icon={<Clock size={16}/>} items={filteredData.filter(a => a.status === 'pending')} status="pending" color="#F39C12" />
          <KanbanColumn title="Confirmado" icon={<CalendarCheck size={16}/>} items={filteredData.filter(a => a.status === 'confirmed')} status="confirmed" color="#2D3436" />
          <KanbanColumn title="Em Atendimento" icon={<Droplet size={16}/>} items={filteredData.filter(a => a.status === 'in_progress')} status="in_progress" color="#00CEC9" />
          <KanbanColumn title="Concluído" icon={<CheckCircle2 size={16}/>} items={filteredData.filter(a => a.status === 'completed')} status="completed" color="#9B59B6" />
      </div>
  );

  const KanbanColumn = ({ title, icon, items, status, color }: any) => (
      <div className="kanban-col">
          <div className="kanban-header" style={{borderTopColor: color}}>
              {icon} <span>{title}</span> <span className="count">{items.length}</span>
          </div>
          <div className="kanban-cards">
              {items.map((app: any) => (
                  <div key={app.id} className="kanban-card">
                      <div className="card-top">
                          <img src={getPetAvatarUrl(app.pets?.name || '')} />
                          <div className="meta">
                              <strong>{app.pets?.name}</strong>
                              <span>{new Date(app.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                      </div>
                      <div className="card-service">{app.services?.name}</div>
                      <div className="card-actions">
                          {status === 'pending' && <button onClick={() => updateStatus(app.id, 'confirmed')} className="btn-kanban-act">Aprovar</button>}
                          {status === 'confirmed' && <button onClick={() => updateStatus(app.id, 'in_progress')} className="btn-kanban-act">Iniciar</button>}
                          {status === 'in_progress' && <button onClick={() => updateStatus(app.id, 'completed')} className="btn-kanban-act highlight">Finalizar</button>}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="container admin-main-page fade-in">
       <div className="admin-top-nav-tabs">
          <div className="brand-context">
              <Logo height={32} />
              <span>Admin Center</span>
          </div>

          <div className="admin-controls-group">
              {/* PERIOD SELECTOR */}
              <div className="period-pill-selector">
                  <button className={timeFilter === 'day' ? 'active' : ''} onClick={() => setTimeFilter('day')}>Dia</button>
                  <button className={timeFilter === 'week' ? 'active' : ''} onClick={() => setTimeFilter('week')}>Semana</button>
                  <button className={timeFilter === 'month' ? 'active' : ''} onClick={() => setTimeFilter('month')}>Mês</button>
              </div>

              <div className="tabs-group">
                  <button className={`tab-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}><LayoutDashboard size={18}/></button>
                  <button className={`tab-item ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}><ListTodo size={18}/></button>
                  <button className={`tab-item ${view === 'agenda' ? 'active' : ''}`} onClick={() => setView('agenda')}><CalendarIcon size={18}/></button>
                  <button className={`tab-item ${view === 'management' ? 'active' : ''}`} onClick={() => setView('management')}><Settings size={18}/></button>
              </div>
          </div>
       </div>

       <div className="admin-scroll-content">
          {loading ? (
              <div className="admin-loading-view"><div className="spinner"></div> Sincronizando dados mestres...</div>
          ) : (
              <>
                {view === 'dashboard' && <DashboardView />}
                {view === 'kanban' && <KanbanView />}
                {view === 'agenda' && <div className="card" style={{minHeight:'600px', padding:0}}><AgendaView appointments={appointments} updateStatus={updateStatus} /></div>}
                {view === 'management' && <AdminManagement />}
              </>
          )}
       </div>
    </div>
  );
};

// Simplified Internal Agenda for the refined grid
const AgendaView = ({ appointments, updateStatus }: any) => {
    const hours = Array.from({length: 11}, (_, i) => i + 8);
    const today = new Date().toDateString();
    const todayApps = appointments.filter((a:any) => new Date(a.start_time).toDateString() === today);

    return (
        <div className="admin-agenda-grid-v2">
            <div className="agenda-time-axis">
                {hours.map(h => <div key={h} className="time-label">{h}:00</div>)}
            </div>
            <div className="agenda-content-area">
                {hours.map(h => <div key={h} className="hour-slot-row"></div>)}
                {todayApps.map((app: any) => {
                    const start = new Date(app.start_time);
                    const top = ((start.getHours() - 8) * 60 + start.getMinutes()) * 1.5; // 1.5px per minute
                    const height = (app.services?.duration_minutes || 60) * 1.5;
                    return (
                        <div key={app.id} className={`agenda-event-box status-${app.status}`} style={{top, height}} onClick={() => updateStatus(app.id, 'in_progress')}>
                            <strong>{app.pets?.name}</strong>
                            <span>{app.services?.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Logo = ({height}: any) => <img src="https://vfryefavzurwoiuznkwv.supabase.co/storage/v1/object/public/site-assets/logo.png" style={{height}} />;
