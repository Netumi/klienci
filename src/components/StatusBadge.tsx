import React from 'react';
import { ClientStatus } from '../store/clientStore';

interface StatusBadgeProps {
  status: ClientStatus;
}

const getStatusClass = (status: ClientStatus) => {
  switch (status) {
    case ClientStatus.Wysłane:
      return 'status-wyslane';
    case ClientStatus.Odrzucone:
      return 'status-odrzucone';
    case ClientStatus.Przyjęte:
      return 'status-przyjete';
    case ClientStatus.WTrakcie:
      return 'status-wtrakcie';
    case ClientStatus.Zrobione:
      return 'status-zrobione';
    default:
      return '';
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      {status}
    </span>
  );
};
