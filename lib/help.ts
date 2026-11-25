/** Plain-language explanations shown in the help drawer ("?" buttons). */
export const HELP: Record<string, string> = {
  Dashboard: 'Your home base: priorities, key metrics and the state of your sales funnel at a glance.',
  Clients: 'Contacts and companies. Open a record to see its history, edit details or change its stage.',
  Pipeline: 'Your sales stages. Drag a card to another column (or use its menu) to record progress.',
  Activities: 'Your follow-ups with due dates and priority. Overdue ones are flagged in red.',
  Reports: 'Metrics calculated live from your CRM data, with the formulas behind each one.',
  Copilot: 'Ask questions about your pipeline in plain English. Uses AI when an API key is configured, and built-in rules otherwise.',
  'Open pipeline': 'Total value of deals in Lead, Proposal and Negotiation. It is potential, not guaranteed revenue.',
  'Weighted forecast':
    'Each open deal multiplied by the probability of its stage closing: Lead 10%, Proposal 30%, Negotiation 60%. A more realistic estimate than the raw pipeline.',
  'Revenue won': 'Total value of deals marked as Won.',
  'Win rate':
    'Deals won ÷ (won + lost). Only closed deals count, so deals still in progress do not drag the rate down.',
  'Average deal size': 'Average value of won deals.',
  'Sales cycle': 'Average number of days from creating a deal to winning it.',
  'Sales velocity':
    '(Open deals × win rate × average deal size) ÷ average sales cycle. It estimates how much revenue your pipeline generates per day; improve any of the four levers and it goes up.',
  'Needs attention': 'Open deals with no activity for 7 days or more. Deals that go quiet tend to go cold.',
};
