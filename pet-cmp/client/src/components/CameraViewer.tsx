import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Hls from "hls.js";
import { Camera, Maximize, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CameraViewer() {
  const { data: streams = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/camera-streams"],
  });

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return streams.filter((s: any) => {
      const matchStatus = statusFilter === "all" || (!!s.isActive ? "online" : "offline") === statusFilter;
      const hay = `${s.petName || s.petId} ${s.roomNumber || ''}`.toLowerCase();
      const matchTerm = term === "" || hay.includes(term);
      return matchStatus && matchTerm;
    });
  }, [streams, statusFilter, search]);

  useEffect(() => {
    // Attach HLS to any m3u8 streams
    streams.forEach((s: any) => {
      const url: string | undefined = s?.streamUrl;
      const vid = videoRefs.current[s.id];
      if (!url || !vid) return;
      const isHls = url.endsWith(".m3u8") || url.includes(".m3u8");
      if (isHls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(vid);
      } else {
        // Native support (Safari)
        vid.src = url;
      }
    });
  }, [streams]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-bold" data-testid="text-page-title">Giám sát Camera</h1>
        <p className="text-muted-foreground mt-1">Theo dõi thú cưng đang lưu trú</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Chỉ chủ nhân, nhân viên và quản lý được phép xem camera. Dữ liệu được lưu trong 24-48 giờ.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <>
        <div className="flex items-center gap-2">
          <input className="w-full sm:w-64 rounded-md border px-3 py-2 text-sm" placeholder="Tìm theo pet/ phòng..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="online">Trực tuyến</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((stream: any) => (
            <Card key={stream.id} data-testid={`camera-card-${stream.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-medium">{stream.petName || stream.petId}</CardTitle>
                  <Badge variant={stream.isActive ? "default" : "secondary"}>
                    {stream.isActive ? "Trực tuyến" : "Offline"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{stream.roomNumber || "Phòng"}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                  {stream.isActive && stream.streamUrl ? (
                    <video ref={(el) => (videoRefs.current[stream.id] = el)} className="object-cover w-full h-full" controls playsInline />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Camera offline</p>
                      </div>
                    </div>
                  )}
                  {stream.isActive && (
                    <div className="absolute top-2 left-2">
                      <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                        <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1" disabled={!stream.isActive || !stream.streamUrl}>
                    <a href={stream.streamUrl} target="_blank" rel="noreferrer">
                      <Maximize className="h-3 w-3 mr-1" />
                      Toàn màn hình
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1" disabled={!stream.isActive || !stream.streamUrl}>
                    <a href={stream.streamUrl} download>
                      <Download className="h-3 w-3 mr-1" />
                      Tải xuống
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12">
              Chưa có camera nào được cấu hình.
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}
