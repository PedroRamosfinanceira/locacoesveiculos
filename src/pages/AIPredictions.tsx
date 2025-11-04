/**
 * AI Predictions Page
 * Main page for viewing payment predictions and risk scores
 */

import DashboardLayout from '@/components/layout/DashboardLayout';
import { AIPredictionsDashboard } from '@/components/ai/AIPredictionsDashboard';

export default function AIPredictions() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <AIPredictionsDashboard />
      </div>
    </DashboardLayout>
  );
}
