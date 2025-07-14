
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const StatCardSkeleton = () => (
  <Card className="border-0 shadow-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16" />
    </CardContent>
  </Card>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div className="flex items-center gap-4 flex-1">
      <Skeleton className="w-12 h-12 rounded" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
  </div>
);
