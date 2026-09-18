import React from 'react';
import { ActionPropsCommon } from '../types';
import { CommonActionFooter } from '../CommonActionFooter';

export const MouseReleaseProps: React.FC<ActionPropsCommon> = ({
  actionNode,
  updateNode,
}) => {
  return (
    <div className="space-y-4">
      <CommonActionFooter actionNode={actionNode} updateNode={updateNode} />
    </div>
  );
};
