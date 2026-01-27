"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { schoolApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { toast } from "sonner";
import { handleApiError } from "@/lib/api/client";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  PartyPopper,
  CheckCircle2,
} from "lucide-react";
import type { CreateStudentRequest, Class, StudentProfileSummary } from "@/types/school";
import { studentSchema, type StudentFormData, type RelativeFormData } from "../school/students/create/schemas";
import { STEPS } from "../school/students/create/constants";
import { RelativeFormModal } from "../school/students/create/RelativeFormModal";
import { PhoneStep } from "../school/students/create/PhoneStep";
import { PersonalInfoStep } from "../school/students/create/PersonalInfoStep";
import { RelativesStep } from "../school/students/create/RelativesStep";
import { AcademicStep } from "../school/students/create/AcademicStep";
import { ReviewStep } from "../school/students/create/ReviewStep";
import { usePhoneLookup } from "@/lib/hooks/usePhoneLookup";

interface CreateStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  classes?: Class[];
}

const ensureArray = <T,>(value: T[] | undefined | null): T[] => 
  Array.isArray(value) ? value : [];

export function CreateStudentForm({ 
  open, 
  onOpenChange, 
  onSuccess, 
  classes 
}: CreateStudentFormProps) {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRelativeModalOpen, setIsRelativeModalOpen] = React.useState(false);
  const [editingRelativeIndex, setEditingRelativeIndex] = React.useState<number | null>(null);

  const classesArray = React.useMemo(() => ensureArray(classes), [classes]);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      phone_number: "",
      first_name: "",
      last_name: "",
      middle_name: "",
      email: "",
      password: "",
      gender: "unspecified",
      status: "active",
      date_of_birth: "",
      address: "",
      class_id: "",
      relatives: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "relatives",
  });

  const phoneNumber = form.watch("phone_number");

  const prefillStudentFromProfile = React.useCallback(
    (profile?: StudentProfileSummary | null) => {
      if (!profile) return;

      const { 
        full_name, 
        first_name, 
        last_name, 
        middle_name, 
        gender, 
        date_of_birth, 
        email 
      } = profile;
      
      const currentValues = form.getValues();
      const nameParts = full_name?.trim().split(/\s+/) || [];

      if (!currentValues.first_name) {
        form.setValue("first_name", first_name || nameParts[0] || "");
      }
      if (!currentValues.last_name) {
        form.setValue(
          "last_name",
          last_name || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : "")
        );
      }
      if (!currentValues.middle_name) {
        form.setValue(
          "middle_name",
          middle_name || (nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "")
        );
      }
      if (!currentValues.gender || currentValues.gender === "unspecified") {
        form.setValue("gender", gender || "unspecified");
      }
      if (!currentValues.date_of_birth) {
        form.setValue("date_of_birth", date_of_birth || "");
      }
      if (!currentValues.email) {
        form.setValue("email", email || "");
      }
    },
    [form]
  );

  const { status: phoneLookupStatus, result: phoneLookupResult } = usePhoneLookup(
    phoneNumber,
    currentBranch?.branch_id,
    prefillStudentFromProfile
  );

  const canSubmit = !phoneLookupResult?.exists_in_branch;

  const handleNext = async () => {
    const fieldsToValidate = STEPS[currentStep - 1].fields as (keyof StudentFormData)[] | undefined;
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      if (currentStep === 1 && !canSubmit) {
        toast.error("Bu o'quvchi filialda mavjud. Davom etish mumkin emas.");
        return;
      }
      if (currentStep < STEPS.length) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const onSubmit = async (data: StudentFormData) => {
    if (!currentBranch?.branch_id) {
      return toast.error("Filial tanlanmagan");
    }
    if (!canSubmit) {
      return toast.error("Bu telefon raqamdagi o'quvchi allaqachon mavjud.");
    }

    setIsSubmitting(true);
    try {
      const requestData: CreateStudentRequest = {
        ...data,
        last_name: data.last_name || undefined,
        middle_name: data.middle_name || undefined,
        email: data.email || undefined,
        password: data.password || undefined,
        gender: data.gender !== "unspecified" ? data.gender : undefined,
        date_of_birth: data.date_of_birth || undefined,
        address: data.address || undefined,
        class_id: data.class_id || undefined,
        relatives: data.relatives?.map((rel) => ({
          ...rel,
          last_name: rel.last_name || "",
          middle_name: rel.middle_name || "",
          phone_number: rel.phone_number || undefined,
        })),
      };

      await schoolApi.createStudent(requestData);
      toast.success("O'quvchi muvaffaqiyatli yaratildi!");
      form.reset();
      setCurrentStep(1);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(apiError.message || "O'quvchi yaratishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddRelativeModal = () => {
    setEditingRelativeIndex(null);
    setIsRelativeModalOpen(true);
  };

  const openEditRelativeModal = (index: number) => {
    setEditingRelativeIndex(index);
    setIsRelativeModalOpen(true);
  };

  const handleSaveRelative = (data: RelativeFormData) => {
    if (editingRelativeIndex !== null) {
      update(editingRelativeIndex, data);
    } else {
      append(data);
    }
    setIsRelativeModalOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* Ensure we override shadcn defaults: sm:max-w-* and enable inner flex for scroll */}
        <DialogContent className="max-w-[85vw] sm:max-w-[85vw] md:max-w-[85vw] lg:max-w-[85vw] xl:max-w-[85vw] h-[95vh] sm:h-[95vh] p-0 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] flex-1 min-h-0 overflow-hidden">
            {/* Sidebar */}
            <div className="hidden md:flex bg-muted/50 border-r h-full">
              {/* Sidebar column: header fixed, nav scrolls */}
              <div className="flex flex-col h-full w-full">
                <DialogHeader className="p-6 pb-4 border-b bg-muted/50">
                  <DialogTitle className="text-lg">Yangi o'quvchi</DialogTitle>
                </DialogHeader>
                <nav className="px-3 pb-6 space-y-1 overflow-y-auto min-h-0 flex-1">
                {STEPS.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <button
                      key={step.id}
                      onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                      disabled={step.id >= currentStep}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
                        currentStep === step.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : step.id < currentStep
                          ? "text-foreground hover:bg-accent"
                          : "text-muted-foreground cursor-not-allowed opacity-50"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                          currentStep === step.id
                            ? "border-primary-foreground"
                            : step.id < currentStep
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {step.id < currentStep ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-medium">{step.id}</span>
                        )}
                      </div>
                      <span className="font-medium">{step.title}</span>
                    </button>
                  );
                })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col h-full overflow-hidden">
              {/* Main content scroll area */}
              <div className="flex-1 overflow-y-auto p-8 min-h-0">
                <Form {...form}>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (currentStep === STEPS.length) {
                        form.handleSubmit(onSubmit)(e);
                      }
                    }}
                    onKeyDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (e.key === 'Enter' && !e.shiftKey && target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        if (currentStep < STEPS.length) {
                          handleNext();
                        } else {
                          form.handleSubmit(onSubmit)();
                        }
                      }
                    }}
                    className="space-y-6"
                  >
                    <div className="pb-4">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStep}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          {currentStep === 1 && (
                            <PhoneStep
                              form={form}
                              phoneLookupStatus={phoneLookupStatus}
                              phoneLookupResult={phoneLookupResult}
                            />
                          )}

                          {currentStep === 2 && <PersonalInfoStep form={form} />}

                          {currentStep === 3 && (
                            <RelativesStep
                              form={form}
                              fields={fields}
                              onAddRelative={openAddRelativeModal}
                              onEditRelative={openEditRelativeModal}
                              onRemoveRelative={remove}
                            />
                          )}

                          {currentStep === 4 && (
                            <AcademicStep form={form} classes={classesArray} />
                          )}

                          {currentStep === 5 && (
                            <ReviewStep
                              form={form}
                              fields={fields}
                              classes={classesArray}
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </form>
                </Form>
              </div>

              {/* Sticky footer navigation */}
              <div className="border-t bg-background p-5 shadow-lg flex-shrink-0">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="h-12 px-8 text-base"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Orqaga
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {currentStep < STEPS.length - 1 && (
                      <p className="text-sm text-muted-foreground hidden sm:block">
                        Enter tugmasini bosing yoki
                      </p>
                    )}
                    {currentStep < STEPS.length ? (
                      <Button 
                        type="button" 
                        onClick={handleNext} 
                        disabled={isSubmitting}
                        size="lg"
                        className="h-12 px-10 text-base font-semibold"
                      >
                        {currentStep === STEPS.length - 1 ? "Ko'rib chiqish" : "Davom etish"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting || !canSubmit}
                        onClick={(e) => {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }}
                        size="lg"
                        className="h-12 px-10 text-base font-semibold bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Yaratilmoqda...
                          </>
                        ) : (
                          <>
                            <PartyPopper className="w-5 h-5 mr-2" />
                            O'quvchini yaratish
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Relative Modal */}
      <RelativeFormModal
        isOpen={isRelativeModalOpen}
        onOpenChange={setIsRelativeModalOpen}
        onSave={handleSaveRelative}
        defaultValues={
          editingRelativeIndex !== null ? fields[editingRelativeIndex] : undefined
        }
      />
    </>
  );
}
