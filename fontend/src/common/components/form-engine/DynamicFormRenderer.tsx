import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormFieldGroup, FormMode } from './form.types';
import { isFieldHidden } from './form.utils';
import { FieldRenderer } from './FieldRenderer';

interface DynamicFormRendererProps {
  groups: FormFieldGroup[];
  mode: FormMode;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ groups, mode }) => {
  const { control } = useFormContext();
  
  // Watch all values to allow dynamic hidden/disabled/required evaluation
  const values = useWatch({ control });

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.id} className="space-y-4">
          {(group.title || group.description) && (
            <div className="mb-4">
              {group.title && <h3 className="text-lg font-medium text-gray-900">{group.title}</h3>}
              {group.description && <p className="text-sm text-gray-500">{group.description}</p>}
            </div>
          )}
          
          <div className={`grid grid-cols-1 ${group.className || 'md:grid-cols-2 gap-5'}`}>
            {group.fields.map((field) => {
              const isHidden = isFieldHidden(field, { values, mode, field });
              
              if (isHidden) {
                return null;
              }

              return (
                <div key={field.key} className={`${field.col || 'col-span-1'} ${field.offset || ''}`}>
                  <FieldRenderer field={field} mode={mode} values={values} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
