import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CompanyPage({ params }: { params: { name: string } }) {
  const companyName = params.name;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{companyName}</CardTitle>
              <p className="text-muted-foreground">Information for Students & Interns</p>
            </div>
            <Badge variant="secondary" className="text-lg py-1 px-3">
              Trust Score: Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Company Overview</h3>
                <p className="text-gray-700">
                  Data is being gathered by our CrewAI agent team. Please check back soon or trigger a fresh report.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Open Opportunities</h3>
                <p className="text-gray-700">Loading internships and job postings...</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Student Verdict</h3>
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                  <p className="text-amber-800">
                    Analysis in progress. Our Student Trust Evaluator is reviewing hiring activity, employee reviews, and social presence.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" disabled>View LinkedIn</Button>
                <Button variant="outline" disabled>Read Reviews</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
