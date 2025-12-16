

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { formatDate, formatCurrency } from '../utils/ui';
import { 
  Calendar as CalendarIcon, LayoutDashboard, ListTodo, User, Phone, 
  TrendingUp, DollarSign, Users, Activity, BarChart3, PieChart, Settings,
  ChevronLeft, ChevronRight, Clock
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
      </div>
  );

  const AgendaView = () => {
      // Estado para navegar nas semanas
      const [currentDate, setCurrentDate] = useState(new Date());

      // Helper para pegar o domingo da semana atual
      const getStartOfWeek = (date: Date) => {
          const d = new Date(date);
          const day = d.getDay();
          const diff = d.getDate() - day; // Ajuste para domingo
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

      // Horas do dia (08:00 as 20:00)
      const hours = Array.from({ length: 13 }, (_, i) => i + 8);
      const PIXELS_PER_HOUR = 60;

      // Filtrar agendamentos da semana
      const weekApps = appointments.filter(app => {
          const d = new Date(app.start_time);
          return d >= startOfWeek && d < new Date(endOfWeek.getTime() + 86400000);
      });

      const handlePrevWeek = () => {
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() - 7);
          setCurrentDate(newDate);
      };

      const handleNextWeek = () => {
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() + 7);
          setCurrentDate(newDate);
      };

      return (
          <div className="fade-in">
              {/* Controls */}
              <div className="calendar-wrapper">
                  <div className="calendar-header-controls">
                      <div style={{display:'flex', alignItems:'center', gap:12}}>
                          <button className="btn-icon-sm" onClick={handlePrevWeek}><ChevronLeft size={20}/></button>
                          <h3 style={{margin:0, fontSize:'1.1rem'}}>
                              {startOfWeek.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})} - {endOfWeek.toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'})}
                          </h3>
                          <button className="btn-icon-sm" onClick={handleNextWeek}><ChevronRight size={20}/></button>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>Hoje</button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="calendar-grid">
                      {/* Header Cells (Time + Days) */}
                      <div className="cal-header-cell"><Clock size={16} style={{margin:'0 auto'}}/></div>
                      {weekDays.map((day, i) => (
                          <div key={i} className="cal-header-cell" style={{background: day.toDateString() === new Date().toDateString() ? '#FFF8E1' : ''}}>
                              <div style={{fontWeight:800}}>{day.toLocaleDateString('pt-BR', {weekday:'short'})}</div>
                              <div style={{fontSize:'1.2rem'}}>{day.getDate()}</div>
                          </div>
                      ))}

                      {/* Time Labels Column */}
                      <div style={{borderRight:'1px solid #eee'}}>
                          {hours.map(h => (
                              <div key={h} className="cal-time-cell">{h}:00</div>
                          ))}
                      </div>

                      {/* Day Columns */}
                      {weekDays.map((day, i) => {
                          // Filtrar apps deste dia
                          const dayApps = weekApps.filter(a => new Date(a.start_time).toDateString() === day.toDateString());

                          return (
                              <div key={i} className="cal-day-col">
                                  {/* Grid Lines */}
                                  {hours.map(h => <div key={h} className="cal-hour-row"></div>)}

                                  {/* Events */}
                                  {dayApps.map(app => {
                                      const start = new Date(app.start_time);
                                      const startHour = start.getHours();
                                      const startMin = start.getMinutes();
                                      
                                      // Calcular posição top (relativo as 8:00)
                                      // Se começa antes das 8, clamp em 0.
                                      const minutesFrom8am = ((startHour - 8) * 60) + startMin;
                                      const top = Math.max(0, (minutesFrom8am / 60) * PIXELS_PER_HOUR);
                                      
                                      // Calcular altura (duração)
                                      const duration = app.services?.duration_minutes || 60;
                                      const height = (duration / 60) * PIXELS_PER_HOUR;

                                      return (
                                          <div 
                                              key={app.id} 
                                              className={`cal-event-card cal-status-${app.status}`}
                                              style={{ top: `${top}px`, height: `${height}px` }}
                                              onClick={() => {
                                                  // Quick action or view details
                                                  const newStatus = app.status === 'pending' ? 'confirmed' : 
                                                                    app.status === 'confirmed' ? 'in_progress' : 
                                                                    app.status === 'in_progress' ? 'completed' : app.status;
                                                  if(newStatus !== app.status && confirm(`Alterar status de ${app.pets?.name} para ${newStatus}?`)) {
                                                      updateStatus(app.id, newStatus);
                                                  }
                                              }}
                                              title={`${app.pets?.name} - ${app.services?.name}`}
                                          >
                                              <strong style={{display:'block', lineHeight:1.2}}>{app.pets?.name}</strong>
                                              <span style={{fontSize:'0.7rem', opacity:0.8}}>{app.services?.name}</span>
                                          </div>
                                      );
                                  })}
                              </div>
                          );
                      })}
                  </div>
              </div>
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
              <CalendarIcon size={16} style={{marginRight:6}}/> Agenda Semanal
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
