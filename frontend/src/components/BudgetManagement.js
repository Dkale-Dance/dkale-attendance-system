import React, { useState } from 'react';
import FeeRevenueForm from './FeeRevenueForm';
import ContributionRevenueForm from './ContributionRevenueForm';
import BudgetList from './BudgetList';
import BudgetSummary from './BudgetSummary';
import ContributorStatusList from './ContributorStatusList';
import styles from './StudentManagement.module.css';
import { BUDGET_LABELS } from '../constants/budgetConstants';

const BudgetManagement = ({ userRole, currentUser }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (userRole !== 'admin') {
    return (
      <div className={styles.unauthorized}>
        <p>You don't have permission to manage budget.</p>
      </div>
    );
  }

  const handleEntryCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEntryDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: 'summary', label: 'Budget Summary', component: BudgetSummary },
    { id: 'fee-revenue', label: BUDGET_LABELS.FEE_REVENUE_TITLE, component: FeeRevenueForm },
    { id: 'contribution-revenue', label: BUDGET_LABELS.CONTRIBUTION_REVENUE_TITLE, component: ContributionRevenueForm },
    { id: 'all-entries', label: 'All Entries', component: BudgetList },
    { id: 'contributors', label: 'Contributor Status', component: ContributorStatusList }
  ];

  const renderActiveComponent = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    if (!activeTabConfig) return null;

    const Component = activeTabConfig.component;
    
    const commonProps = {
      refreshTrigger,
      onEntryCreated: handleEntryCreated,
      onEntryDeleted: handleEntryDeleted,
      currentUser
    };

    switch (activeTab) {
      case 'summary':
        return <Component {...commonProps} />;
      case 'fee-revenue':
        return (
          <div>
            <Component {...commonProps} />
            <BudgetList 
              {...commonProps} 
              budgetType="fee_revenue"
              title={BUDGET_LABELS.FEE_REVENUE_TITLE}
            />
          </div>
        );
      case 'contribution-revenue':
        return (
          <div>
            <Component {...commonProps} />
            <BudgetList 
              {...commonProps} 
              budgetType="contribution_revenue"
              title={BUDGET_LABELS.CONTRIBUTION_REVENUE_TITLE}
            />
          </div>
        );
      case 'all-entries':
        return <Component {...commonProps} title="All Budget Entries" />;
      case 'contributors':
        return <Component {...commonProps} />;
      default:
        return <Component {...commonProps} />;
    }
  };

  return (
    <div className={styles.managementContainer}>
      <h2>{BUDGET_LABELS.TITLE}</h2>
      
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? styles.activeTab : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {renderActiveComponent()}
      </div>
    </div>
  );
};

export default BudgetManagement;