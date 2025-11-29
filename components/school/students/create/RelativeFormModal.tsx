"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { relativeSchema, type RelativeFormData } from "./schemas";
import { relationshipTypes } from "./constants";

interface RelativeFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: RelativeFormData) => void;
  defaultValues?: Partial<RelativeFormData>;
}

export function RelativeFormModal({ 
  isOpen, 
  onOpenChange, 
  onSave, 
  defaultValues 
}: RelativeFormModalProps) {
  const form = useForm<RelativeFormData>({
    resolver: zodResolver(relativeSchema),
    defaultValues: {
      relationship_type: "father",
      first_name: "",
      last_name: "",
      middle_name: "",
      phone_number: "",
      is_primary_contact: false,
      is_guardian: false,
      ...defaultValues,
    },
  });

  React.useEffect(() => {
    form.reset(defaultValues || {
      relationship_type: "father", 
      first_name: "", 
      last_name: "", 
      middle_name: "", 
      phone_number: "",
      is_primary_contact: false, 
      is_guardian: false,
    });
  }, [defaultValues, isOpen, form]);

  const onSubmit = (data: RelativeFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Yaqinni tahrirlash" : "Yangi yaqin qo'shish"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField 
              control={form.control} 
              name="first_name" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Ism *</FormLabel>
                  <FormControl>
                    <Input placeholder="Olim" {...field} className="h-12 text-lg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            
            <FormField 
              control={form.control} 
              name="last_name" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Familiya</FormLabel>
                  <FormControl>
                    <Input placeholder="Valiyev" {...field} className="h-12 text-lg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
              
            <FormField 
              control={form.control} 
              name="middle_name" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Otasining ismi</FormLabel>
                  <FormControl>
                    <Input placeholder="Karim o&apos;g&apos;li" {...field} className="h-12 text-lg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              control={form.control} 
              name="relationship_type" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Qarindoshlik *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relationshipTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-lg py-3">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} 
          />
          
          <FormField 
            control={form.control} 
            name="phone_number" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Telefon raqami</FormLabel>
                <FormControl>
                  <PhoneInput 
                    value={field.value || ""} 
                    onChange={field.onChange} 
                    error={form.formState.errors.phone_number?.message}
                      label="" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            <div className="flex flex-col gap-3 pt-2">
              <FormField
                control={form.control}
                name="is_primary_contact"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Asosiy kontakt</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_guardian"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Vasiy</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">Bekor qilish</Button>
              </DialogClose>
              <Button type="submit">Saqlash</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
