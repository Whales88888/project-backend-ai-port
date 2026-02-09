import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import dogImage from "@assets/stock_images/cute_golden_retrieve_eabbb615.jpg";

const medicalRecordSchema = z.object({
  petId: z.string().min(1, "Vui lòng chọn thú cưng"),
  veterinarianId: z.string().min(1, "Vui lòng chọn bác sĩ"),
  symptoms: z.string().min(1, "Triệu chứng là bắt buộc"),
  diagnosis: z.string().min(1, "Chẩn đoán là bắt buộc"),
  treatment: z.string().min(1, "Phương pháp điều trị là bắt buộc"),
  notes: z.string().optional(),
});

type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;

export function MedicalRecordForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load data
  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["/api/pets"],
  });

  const { data: veterinarians = [] } = useQuery<any[]>({
    queryKey: ["/api/users", { role: "veterinarian" }],
  });

  const { data: recentRecords = [] } = useQuery<any[]>({
    queryKey: ["/api/medical-records"],
  });

  // Form setup
  const form = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      petId: "",
      veterinarianId: "",
      symptoms: "",
      diagnosis: "",
      treatment: "",
      notes: "",
    },
  });

  const selectedPetId = form.watch("petId");
  const selectedPet = pets.find((pet: any) => pet.id === selectedPetId);

  // Create medical record mutation
  const createMutation = useMutation({
    mutationFn: async (data: MedicalRecordFormData) => {
      const payload = {
        petId: data.petId,
        veterinarianId: data.veterinarianId,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        notes: data.notes,
      };
      const res = await apiRequest("POST", "/api/medical-records", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      toast({
        title: "Thành công",
        description: "Đã lưu hồ sơ khám bệnh",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu hồ sơ khám bệnh",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MedicalRecordFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-bold" data-testid="text-page-title">Hồ sơ khám bệnh</h1>
        <p className="text-muted-foreground mt-1">Ghi nhận và quản lý hồ sơ điều trị</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tạo hồ sơ khám mới</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pet">Thú cưng *</Label>
                  <Select
                    value={form.watch("petId")}
                    onValueChange={(value) => form.setValue("petId", value)}
                  >
                    <SelectTrigger id="pet" data-testid="select-pet">
                      <SelectValue placeholder="Chọn thú cưng" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map((pet: any) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} - {pet.species}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.petId && (
                    <p className="text-sm text-red-500">{form.formState.errors.petId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor">Bác sĩ *</Label>
                  <Select
                    value={form.watch("veterinarianId")}
                    onValueChange={(value) => form.setValue("veterinarianId", value)}
                  >
                    <SelectTrigger id="doctor" data-testid="select-doctor">
                      <SelectValue placeholder="Chọn bác sĩ" />
                    </SelectTrigger>
                    <SelectContent>
                      {veterinarians.map((vet: any) => (
                        <SelectItem key={vet.id} value={vet.id}>
                          {vet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.veterinarianId && (
                    <p className="text-sm text-red-500">{form.formState.errors.veterinarianId.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Triệu chứng *</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Mô tả triệu chứng của thú cưng..."
                  {...form.register("symptoms")}
                  rows={3}
                  data-testid="input-symptoms"
                />
                {form.formState.errors.symptoms && (
                  <p className="text-sm text-red-500">{form.formState.errors.symptoms.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Chẩn đoán *</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Kết quả chẩn đoán..."
                  {...form.register("diagnosis")}
                  rows={3}
                  data-testid="input-diagnosis"
                />
                {form.formState.errors.diagnosis && (
                  <p className="text-sm text-red-500">{form.formState.errors.diagnosis.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment">Phương pháp điều trị *</Label>
                <Textarea
                  id="treatment"
                  placeholder="Ghi chú phương pháp điều trị..."
                  {...form.register("treatment")}
                  rows={3}
                  data-testid="input-treatment"
                />
                {form.formState.errors.treatment && (
                  <p className="text-sm text-red-500">{form.formState.errors.treatment.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú thêm..."
                  {...form.register("notes")}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-save-record"
                >
                  {createMutation.isPending ? "Đang lưu..." : "Lưu hồ sơ"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin thú cưng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPet ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedPet.imageUrl || dogImage} alt={selectedPet.name} />
                      <AvatarFallback>{selectedPet.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedPet.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPet.species}</p>
                      <p className="text-sm text-muted-foreground">{selectedPet.age} tuổi, {selectedPet.weight}kg</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-sm"><span className="text-muted-foreground">Giống:</span> {selectedPet.breed || "Không xác định"}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Giới tính:</span> {selectedPet.gender || "Không xác định"}</p>
                    {selectedPet.microchip && (
                      <p className="text-sm"><span className="text-muted-foreground">Microchip:</span> {selectedPet.microchip}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chọn thú cưng để xem thông tin</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Lịch sử khám
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPetId ? (
                recentRecords
                  .filter((record: any) => record.petId === selectedPetId)
                  .slice(0, 5)
                  .map((record: any) => (
                    <div key={record.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{record.diagnosis}</p>
                        <Badge variant="secondary" className="text-xs">Hoàn thành</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.visitDate).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-muted-foreground">{record.symptoms}</p>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chọn thú cưng để xem lịch sử</p>
                </div>
              )}
              {selectedPetId && recentRecords.filter((record: any) => record.petId === selectedPetId).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chưa có lịch sử khám</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
