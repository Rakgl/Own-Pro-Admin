<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { Activity, CreditCard, DollarSign, Users, ArrowUpRight, TrendingUp, Calendar } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart } from '@/components/ui/chart-bar'
import { LineChart } from '@/components/ui/chart-line'
import { DonutChart } from '@/components/ui/chart-donut'
import { Button } from '@/components/ui/button'
import { themes } from '@/lib/registry/themes'

const isLoading = ref(true)
const { theme } = useCustomize()
const colorMode = useColorMode()

// Dynamically compute chart colors based on current theme
const themeColors = computed(() => {
  const currentTheme = themes.find(t => t.name === theme.value)
  const mode = colorMode.value === 'dark' ? 'dark' : 'light'
  
  // Get primary color HSL
  const primaryHsl = currentTheme?.cssVars[mode].primary
  // Fallback if not found
  const primary = primaryHsl ? `hsl(${primaryHsl})` : '#3b82f6'
  
  // Generate palette based on primary color
  // Ideally we would parse HSL and shift hue, but for simplicity we can use primary 
  // and some fixed accents that likely work well, OR just use the primary color for single-series charts.
  
  return {
    bar: [primary],
    // For line/donut which need distinct colors, we might still want variations or complementary colors.
    // However, "dynamic" usually means "use the theme". 
    // Let's use the primary color as the main one, and secondary/accent for others.
    line: [primary, `hsl(${currentTheme?.cssVars[mode].secondary || '210 40% 96.1%'})`],
    donut: [primary, `hsl(${currentTheme?.cssVars[mode].muted || '210 40% 96.1%'})`, `hsl(${currentTheme?.cssVars[mode].accent || '210 40% 96.1%'})`, `hsl(${currentTheme?.cssVars[mode].secondary || '210 40% 96.1%'})`],
  }
})

const dataCard = ref({
  totalRevenue: 0,
  totalRevenueDesc: 0,
  subscriptions: 0,
  subscriptionsDesc: 0,
  sales: 0,
  salesDesc: 0,
  activeNow: 0,
  activeNowDesc: 0,
})

const dataRecentSales = [
  {
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: 1999,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
  },
  {
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: 39,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jackson',
  },
  {
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: 299,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella',
  },
  {
    name: 'William Kim',
    email: 'will@email.com',
    amount: 99,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=William',
  },
  {
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: 39,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
  },
]

const barChartData = [
  { name: 'Jan', total: 4500 },
  { name: 'Feb', total: 3200 },
  { name: 'Mar', total: 5600 },
  { name: 'Apr', total: 2300 },
  { name: 'May', total: 6700 },
  { name: 'Jun', total: 4100 },
  { name: 'Jul', total: 3800 },
  { name: 'Aug', total: 5200 },
  { name: 'Sep', total: 4900 },
  { name: 'Oct', total: 6100 },
  { name: 'Nov', total: 5800 },
  { name: 'Dec', total: 7200 },
]

const lineChartData = [
  { month: 'Jan', Sales: 4000, Profit: 2400 },
  { month: 'Feb', Sales: 3000, Profit: 1398 },
  { month: 'Mar', Sales: 2000, Profit: 9800 },
  { month: 'Apr', Sales: 2780, Profit: 3908 },
  { month: 'May', Sales: 1890, Profit: 4800 },
  { month: 'Jun', Sales: 2390, Profit: 3800 },
  { month: 'Jul', Sales: 3490, Profit: 4300 },
]

const donutChartData = [
  { name: 'Direct', value: 400 },
  { name: 'Referral', value: 300 },
  { name: 'Social', value: 300 },
  { name: 'Organic', value: 200 },
]

const kpiCards = computed(() => [
  {
    title: 'Total Revenue',
    icon: DollarSign,
    value: dataCard.value.totalRevenue,
    descValue: dataCard.value.totalRevenueDesc,
    format: { style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' },
    descFormat: { style: 'percent', minimumFractionDigits: 1 },
    // Use dynamic classes based on primary color
    borderClass: 'border-l-4 border-l-primary',
    iconClass: 'text-primary bg-primary/10',
  },
  {
    title: 'Subscriptions',
    icon: Users,
    value: dataCard.value.subscriptions,
    descValue: dataCard.value.subscriptionsDesc,
    descFormat: { style: 'percent', minimumFractionDigits: 1 },
    borderClass: 'border-l-4 border-l-primary',
    iconClass: 'text-primary bg-primary/10',
  },
  {
    title: 'Sales',
    icon: CreditCard,
    value: dataCard.value.sales,
    descValue: dataCard.value.salesDesc,
    descFormat: { style: 'percent', minimumFractionDigits: 1 },
    borderClass: 'border-l-4 border-l-primary',
    iconClass: 'text-primary bg-primary/10',
  },
  {
    title: 'Active Now',
    icon: Activity,
    value: dataCard.value.activeNow,
    descValue: dataCard.value.activeNowDesc,
    borderClass: 'border-l-4 border-l-primary',
    iconClass: 'text-primary bg-primary/10',
  },
])

onMounted(async () => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  dataCard.value = {
    totalRevenue: 45231.89,
    totalRevenueDesc: 0.201,
    subscriptions: 2350,
    subscriptionsDesc: 1.805,
    sales: 12234,
    salesDesc: 0.45,
    activeNow: 573,
    activeNowDesc: 201,
  }
  isLoading.value = false
})
</script>

<template>
  <div class="w-full flex flex-col gap-6 p-2">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-block">
          Dashboard
        </h2>
        <p class="text-muted-foreground mt-1">
          Overview of your key performance metrics.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <BaseDateRangePicker />
        <Button class="shadow-sm hover:shadow transition-shadow">
          <ArrowUpRight class="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>

    <main class="flex flex-1 flex-col gap-6">
      
      <!-- KPI Cards -->
      <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        <Card 
          v-for="(card, i) in kpiCards" 
          :key="i"
          :class="['transition-all duration-300 hover:shadow-lg hover:-translate-y-1', card.borderClass]"
        >
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium text-muted-foreground">
              {{ card.title }}
            </CardTitle>
            <div :class="['p-2 rounded-full', card.iconClass]">
              <component :is="card.icon" class="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <Skeleton v-if="isLoading" class="h-8 w-[120px]" />
              <NumberFlow
                v-else
                :value="card.value"
                :format="card.format"
                :prefix="i !== 0 ? '+' : undefined"
              />
            </div>
            <p class="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Skeleton v-if="isLoading" class="h-3 w-[140px]" />
              <template v-else>
                <span class="text-primary font-medium flex items-center bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">
                  <TrendingUp class="h-3 w-3 mr-1" />
                  <NumberFlow
                    :value="card.descValue"
                    :format="card.descFormat"
                    prefix="+"
                  />
                </span>
                <span class="opacity-80">{{ i === 3 ? 'since last hour' : 'from last month' }}</span>
              </template>
            </p>
          </CardContent>
        </Card>
      </div>
      
      <!-- Charts Row 1: Bar & Pie -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card class="col-span-4 transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue breakdown for the current year.</CardDescription>
          </CardHeader>
          <CardContent class="pl-2">
            <div v-if="isLoading" class="h-[350px] w-full flex items-center justify-center">
              <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <BarChart 
              v-else 
              :data="barChartData" 
              :categories="['total']" 
              index="name" 
              :colors="themeColors.bar"
              :rounded-corners="4" 
              class="h-[350px]" 
            />
          </CardContent>
        </Card>

        <Card class="col-span-3 transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your users are coming from.</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="isLoading" class="h-[350px] w-full flex items-center justify-center">
               <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <DonutChart 
              v-else 
              :data="donutChartData" 
              index="name" 
              category="value" 
              :colors="themeColors.donut"
              type="pie" 
              class="h-[350px]" 
            />
          </CardContent>
        </Card>
      </div>

      <!-- Charts Row 2: Line & Recent Sales -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
         <Card class="col-span-4 transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Comparing sales versus profit margins over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="isLoading" class="h-[350px] w-full flex items-center justify-center">
               <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <LineChart 
              v-else 
              :data="lineChartData" 
              index="month" 
              :categories="['Sales', 'Profit']" 
              :colors="themeColors.line"
              class="h-[350px]" 
            />
          </CardContent>
        </Card>

        <Card class="col-span-3 transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest financial activity from users.</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="isLoading" class="space-y-6">
               <div v-for="i in 5" :key="i" class="flex items-center gap-4">
                  <Skeleton class="h-10 w-10 rounded-full" />
                  <div class="grid gap-2">
                    <Skeleton class="h-4 w-[120px]" />
                    <Skeleton class="h-3 w-[150px]" />
                  </div>
                  <Skeleton class="ml-auto h-4 w-[60px]" />
               </div>
            </div>
            <div v-else class="space-y-1">
              <div
                v-for="recentSales in dataRecentSales" :key="recentSales.name"
                class="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-default group"
              >
                <Avatar class="h-10 w-10 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                  <AvatarImage :src="recentSales.avatar" :alt="recentSales.name" />
                  <AvatarFallback>{{ recentSales.name.split(' ').map((n) => n[0]).join('') }}</AvatarFallback>
                </Avatar>
                <div class="grid gap-1">
                  <p class="text-sm font-semibold leading-none group-hover:text-primary transition-colors">
                    {{ recentSales.name }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ recentSales.email }}
                  </p>
                </div>
                <div class="ml-auto font-medium font-mono text-sm bg-muted/50 px-2 py-1 rounded group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <NumberFlow
                    :value="recentSales.amount"
                    :format="{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }"
                    prefix="+"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>