import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Users } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const plans = [
  {
    id: "demo",
    name: "Demo",
    price: "Free",
    description: "Try our service with limited features",
    features: ["20 leads", "Basic support"],
    icon: Users,
    popular: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: "€30",
    period: "/month",
    description: "Perfect for small businesses",
    features: ["100 leads", "Email campaigns", "Standard support"],
    icon: Check,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "€50",
    period: "/month",
    description: "For growing businesses",
    features: ["200 leads", "Advanced analytics", "Priority support"],
    icon: Zap,
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "€150",
    period: "/month",
    description: "Complete business solution",
    features: ["500 leads", "Email campaigns", "Content creation", "24/7 support"],
    icon: Crown,
    popular: false,
  },
];

export const SubscriptionPlans = () => {
  const { subscription, loading, createCheckout, openCustomerPortal } = useSubscription();

  const handlePlanSelect = (planId: string) => {
    if (planId === "demo") return; // Demo is free, no action needed
    createCheckout(planId);
  };

  const isCurrentPlan = (planId: string) => {
    if (planId === "demo" && !subscription.subscribed) return true;
    return subscription.subscription_tier?.toLowerCase() === planId;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Select the perfect plan for your business needs
        </p>
        {subscription.subscribed && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={openCustomerPortal}
              variant="outline"
              disabled={loading}
            >
              Manage Subscription
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = isCurrentPlan(plan.id);

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? "border-primary shadow-lg" : ""
              } ${isCurrent ? "ring-2 ring-primary" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {isCurrent && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 right-4"
                >
                  Current Plan
                </Badge>
              )}

              <CardHeader className="text-center">
                <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={loading || isCurrent || plan.id === "demo"}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {isCurrent
                    ? "Current Plan"
                    : plan.id === "demo"
                    ? "Free Plan"
                    : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};