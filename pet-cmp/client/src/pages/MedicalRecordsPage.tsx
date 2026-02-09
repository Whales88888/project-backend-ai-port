import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Eye, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicalRecordForm } from "@/components/MedicalRecordForm";
import { apiRequest } from "@/lib/queryClient";

export default function MedicalRecordsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: medicalRecords = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/medical-records"],
  });

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["/api/pets"],
  });

  const { data: veterinarians = [] } = useQuery<any[]>({
    queryKey: ["/api/users", { role: "veterinarian" }],
  });

  const getPetName = (petId: string) => {
    const pet = pets.find((p: any) => p.id === petId);
    return pet ? pet.name : "Không xác định";
  };

  const getVeterinarianName = (vetId: string) => {
    const vet = veterinarians.find((v: any) => v.id === vetId);
    return vet ? vet.name : "Không xác định";
  };

  const filteredRecords = medicalRecords.filter((record: any) =>
    record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPetName(record.petId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getVeterinarianName(record.veterinarianId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Quản lý hồ sơ khám bệnh</h1>
        <p className="text-muted-foreground mt-1">Tạo mới và xem lịch sử hồ sơ khám bệnh</p>
      </div>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Danh sách hồ sơ</TabsTrigger>
          <TabsTrigger value="create">Tạo hồ sơ mới</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Tìm kiếm hồ sơ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Badge variant="secondary">
              {filteredRecords.length} hồ sơ
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Không có hồ sơ nào</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Không tìm thấy hồ sơ phù hợp" : "Chưa có hồ sơ khám bệnh nào"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRecords.map((record: any) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{record.diagnosis}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {getPetName(record.petId)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(record.visitDate).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">Hoàn thành</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-1">Triệu chứng:</h4>
                      <p className="text-sm text-muted-foreground">{record.symptoms}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Điều trị:</h4>
                      <p className="text-sm text-muted-foreground">{record.treatment}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        Bác sĩ: {getVeterinarianName(record.veterinarianId)}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    </div>
                    {record.notes && (
                      <div className="pt-3 border-t">
                        <h4 className="font-medium mb-1">Ghi chú:</h4>
                        <p className="text-sm text-muted-foreground">{record.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <MedicalRecordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
