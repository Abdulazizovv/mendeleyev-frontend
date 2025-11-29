"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentFormData } from "./schemas";

interface PersonalInfoStepProps {
  form: UseFormReturn<StudentFormData>;
}

export function PersonalInfoStep({ form }: PersonalInfoStepProps) {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="space-y-2 pb-4">
        <CardTitle className="text-2xl font-semibold">2. Shaxsiy ma&apos;lumotlar</CardTitle>
        <CardDescription className="text-base">
          O&apos;quvchining asosiy ma&apos;lumotlarini to&apos;ldiring.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name fields */}
        <div className="space-y-1.5">
          <h3 className="text-base font-medium text-muted-foreground uppercase tracking-wide">Ism-familiya</h3>
          <div className="space-y-4">
            <FormField 
              control={form.control} 
              name="first_name" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Ism *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ali" 
                      {...field} 
                      className="h-12 text-lg" 
                    />
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
                    <Input 
                      placeholder="Valiyev" 
                      {...field} 
                      className="h-12 text-lg" 
                    />
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
                      <Input 
                        placeholder="Olim o&apos;g&apos;li" 
                        {...field} 
                        className="h-12 text-lg" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
          </div>
        </div>

        {/* Gender and Date of Birth */}
        <div className="space-y-1.5">
          <h3 className="text-base font-medium text-muted-foreground uppercase tracking-wide">Tug&apos;ilgan ma&apos;lumotlari</h3>
          <div className="space-y-4">
          <FormField 
            control={form.control} 
            name="gender" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Jins</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-12 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Erkak</SelectItem>
                    <SelectItem value="female">Ayol</SelectItem>
                    <SelectItem value="other">Boshqa</SelectItem>
                    <SelectItem value="unspecified">Ko&apos;rsatilmagan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} 
          />
          
            <FormField 
              control={form.control} 
              name="date_of_birth" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Tug&apos;ilgan sana</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      className="h-12 text-lg" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <h3 className="text-base font-medium text-muted-foreground uppercase tracking-wide">Aloqa ma'lumotlari</h3>
          <FormField 
            control={form.control} 
            name="address" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Yashash manzili</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Toshkent sh., Chilonzor t." 
                    {...field} 
                    className="h-12 text-lg" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />
        </div>

        <Separator className="my-6" />

        {/* Email and Password */}
        <div className="space-y-1.5">
          <h3 className="text-base font-medium text-muted-foreground uppercase tracking-wide">
            Tizimga kirish (ixtiyoriy)
          </h3>
          
          <div className="space-y-4">
            <FormField 
              control={form.control} 
              name="email" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="ali@example.com" 
                      {...field} 
                      className="h-12 text-lg" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            
            <FormField 
              control={form.control} 
              name="password" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Parol</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Kamida 8 ta belgi" 
                      {...field} 
                      className="h-12 text-lg" 
                    />
                  </FormControl>
                  <FormDescription className="text-sm">
                    Keyinroq o'rnatishi ham mumkin.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
