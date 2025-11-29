"use client";

import * as React from "react";
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { Plus, Users, Edit, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StudentFormData, RelativeFormData } from "./schemas";
import { relationshipTypes } from "./constants";

interface RelativesStepProps {
  form: UseFormReturn<StudentFormData>;
  fields: UseFieldArrayReturn<StudentFormData, "relatives", "id">["fields"];
  onAddRelative: () => void;
  onEditRelative: (index: number) => void;
  onRemoveRelative: (index: number) => void;
}

export function RelativesStep({ 
  form, 
  fields, 
  onAddRelative, 
  onEditRelative, 
  onRemoveRelative 
}: RelativesStepProps) {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold">3. Yaqinlari</CardTitle>
          <CardDescription className="text-base">
            Ota-ona yoki vasiy ma&apos;lumotlari.
          </CardDescription>
        </div>
        <Button 
          type="button" 
          variant="default" 
          size="default"
          onClick={onAddRelative}
          className="h-11 px-5 text-base font-semibold">
        
          <Plus className="w-4 h-4 mr-2" /> 
          Qo'shish
        </Button>
      </CardHeader>
      
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Yaqinlar qo'shilmagan</p>
            <p className="text-sm mt-1">"Qo'shish" tugmasini bosing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div 
                key={field.id} 
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {field.first_name} {field.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base text-muted-foreground">
                      {relationshipTypes.find(rt => rt.value === field.relationship_type)?.label}
                    </p>
                    {field.phone_number && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-base text-muted-foreground">
                          {field.phone_number}
                        </p>
                      </>
                    )}
                  </div>
                  {(field.is_primary_contact || field.is_guardian) && (
                    <div className="flex gap-2 mt-2">
                      {field.is_primary_contact && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700">
                          Asosiy kontakt
                        </span>
                      )}
                      {field.is_guardian && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-purple-100 text-purple-700">
                          Vasiy
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 ml-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={() => onEditRelative(index)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-destructive hover:text-destructive" 
                    onClick={() => onRemoveRelative(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
