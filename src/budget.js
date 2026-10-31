export const dayKey = (date) => { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function periodBounds(today, cycle='monthly') {
  const d=new Date(today); d.setHours(0,0,0,0);
  let start,end;
  if(cycle==='weekly'){start=new Date(d);start.setDate(d.getDate()-((d.getDay()+6)%7));end=new Date(start);end.setDate(start.getDate()+7);}
  else if(cycle==='biweekly'){const anchor=new Date(2024,0,1);const weeks=Math.floor((d-anchor)/86400000/14);start=new Date(anchor);start.setDate(anchor.getDate()+weeks*14);end=new Date(start);end.setDate(start.getDate()+14);}
  else {start=new Date(d.getFullYear(),d.getMonth(),1);end=new Date(d.getFullYear(),d.getMonth()+1,1);}
  return {start,end,days:Math.round((end-start)/86400000),remainingDays:Math.round((end-d)/86400000)};
}
export function budgetSummary(settings,transactions,today=new Date()){
  const {start,end,days,remainingDays}=periodBounds(today,settings.cycle);
  const expenses=transactions.filter(t=>t.type==='expense'&&new Date(t.date)>=start&&new Date(t.date)<end);
  const spent=expenses.reduce((sum,t)=>sum+Number(t.amount),0);
  const todaySpent=expenses.filter(t=>dayKey(t.date)===dayKey(today)).reduce((sum,t)=>sum+Number(t.amount),0);
  const total=Math.max(0,Number(settings.budget)||0);
  const daily=days?total/days:0;
  const safePerDay=settings.rollover===false?daily:Math.max(0,(total-spent+todaySpent)/Math.max(1,remainingDays));
  const leftToday=Math.max(0,safePerDay-todaySpent);
  return {start,end,days,remainingDays,total,spent,todaySpent,safePerDay,leftToday,percent:safePerDay?todaySpent/safePerDay:todaySpent?2:0};
}
