/**
 * @file page.tsx
 * @description Governance votes dashboard with modern design.
 * @module app/[locale]/governance
 */

"use client";

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, RefreshCcw, XCircle } from "lucide-react";

import { GovernanceVotesService } from "@/api/services/GovernanceVotesService";
import type {
  IGovernanceVoteByAddress,
  IGovernanceVotesResponse,
} from "@/api/types/governance-votes.types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/utils/formatters";
import { TableVirtuoso, type TableComponents } from "react-virtuoso";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedPage, FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { MobileNav } from "@/components/ui/mobile-nav";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Copy, Search } from "lucide-react";

const governanceVotesService = new GovernanceVotesService();

const formatNumeric = (value: string | number, maximumFractionDigits = 2) => {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isFinite(numericValue)) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits,
    }).format(numericValue);
  }

  return String(value);
};

const formatRatio = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
  }).format(value);

const formatShare = (value: number, maximumFractionDigits = 2) =>
  `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value)}%`;

const toRatio = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value / 100));
};

const toNumber = (value: string | number) => {
  const numeric = Number.parseFloat(String(value));
  return Number.isFinite(numeric) ? numeric : 0;
};

const YES_COLOR = "#10B981";
const NO_COLOR = "#F43F5E";
const OTHER_COLOR = "#CBD5F5";

interface DonutSegment {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

const DonutChart = memo(
  ({
    data,
    centerTitle,
    centerValue,
    size = 180,
  }: {
    data: DonutSegment[];
    centerTitle: string;
    centerValue: string;
    size?: number;
  }) => {
    // Filter out zero values to prevent rendering issues
    const validData = data.filter((d) => d.value > 0);

    if (validData.length === 0) {
      return (
        <div
          className="relative mx-auto flex items-center justify-center bg-muted/20 rounded-full"
          style={{ width: size, height: size }}
        >
          <div className="text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {centerTitle}
            </span>
            <div className="text-base font-semibold">{centerValue}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative mx-auto flex-shrink-0" style={{ width: size, height: size }}>
        <PieChart width={size} height={size}>
          <Pie
            data={validData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {validData.map((segment) => (
              <Cell key={segment.name} fill={segment.color} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {centerTitle}
          </span>
          <span className="text-lg font-bold">{centerValue}</span>
        </div>
      </div>
    );
  }
);
DonutChart.displayName = "DonutChart";

const DonutLegend = ({
  items,
}: {
  items: {
    label: string;
    primary: string;
    secondary?: string;
    color: string;
  }[];
}) => (
  <div className="grid gap-2 text-sm">
    {items.map((item) => (
      <div
        key={item.label}
        className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5"
      >
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </span>
          <span className="font-semibold">{item.primary}</span>
          {item.secondary ? (
            <span className="text-xs text-muted-foreground">
              {item.secondary}
            </span>
          ) : null}
        </div>
      </div>
    ))}
  </div>
);

const VIRTUALIZED_TABLE_ROW_HEIGHT = 56;

type VoteMode = "current" | "quadratic";

type HolderCategoryDefinition = {
  id: string;
  label: string;
  min: number;
  max: number;
};

type HolderCategoryStat = HolderCategoryDefinition & {
  totalCount: number;
  yesCount: number;
  noCount: number;
  totalVotePower: number;
  yesVotePower: number;
  noVotePower: number;
  shareTotalVoters: number;
  shareYesVoters: number;
  shareNoVoters: number;
  shareTotalPower: number;
  shareYesPower: number;
  shareNoPower: number;
};

const HOLDER_CATEGORIES_LIVE: HolderCategoryDefinition[] = [
  { id: "lt10", label: "< 10 EGLD", min: 0, max: 10 },
  { id: "10to100", label: "10 - < 100 EGLD", min: 10, max: 100 },
  { id: "100to1000", label: "100 - < 1,000 EGLD", min: 100, max: 1000 },
  { id: "1kto5k", label: "1,000 - < 5,000 EGLD", min: 1000, max: 5000 },
  { id: "5kto10k", label: "5,000 - < 10,000 EGLD", min: 5000, max: 10000 },
  { id: "10kto15k", label: "10,000 - < 15,000 EGLD", min: 10000, max: 15000 },
  { id: "15kto25k", label: "15,000 - < 25,000 EGLD", min: 15000, max: 25000 },
  { id: "25kto50k", label: "25,000 - < 50,000 EGLD", min: 25000, max: 50000 },
  {
    id: "gte50k",
    label: ">= 50,000 EGLD",
    min: 50000,
    max: Number.POSITIVE_INFINITY,
  },
];

const HOLDER_CATEGORIES_SIMULATION: HolderCategoryDefinition[] = [
  { id: "lt10", label: "< 10 EGLD", min: 0, max: 10 },
  { id: "10to100", label: "10 - < 100 EGLD", min: 10, max: 100 },
  { id: "100to1000", label: "100 - < 1,000 EGLD", min: 100, max: 1000 },
  { id: "1kto5k", label: "1,000 - < 5,000 EGLD", min: 1000, max: 5000 },
  { id: "5kto10k", label: "5,000 - < 10,000 EGLD", min: 5000, max: 10000 },
  {
    id: "gte10k",
    label: ">= 10,000 EGLD",
    min: 10000,
    max: Number.POSITIVE_INFINITY,
  },
];

const getHolderCategoryDefinitions = (
  mode: VoteMode
): HolderCategoryDefinition[] =>
  mode === "quadratic" ? HOLDER_CATEGORIES_SIMULATION : HOLDER_CATEGORIES_LIVE;

const getCategoryByValue = (
  value: number,
  definitions: HolderCategoryDefinition[]
): HolderCategoryDefinition => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  for (const category of definitions) {
    if (safeValue >= category.min && safeValue < category.max) {
      return category;
    }
  }
  return definitions[definitions.length - 1];
};

const computeQuadraticSimulation = (
  data: IGovernanceVotesResponse
): IGovernanceVotesResponse => {
  const transformVotes = (votes: IGovernanceVoteByAddress[]) =>
    votes.map((vote) => {
      const basePower = Math.max(0, toNumber(vote.voteShort));
      const quadraticPower = basePower > 0 ? Math.sqrt(basePower) : 0;

      return {
        ...vote,
        vote: quadraticPower.toString(),
        voteShort: quadraticPower,
        share: 0,
        shareTotal: 0,
      };
    });

  const simulatedYes = transformVotes(data.orderedGovernanceVotesByAddressYes);
  const simulatedNo = transformVotes(data.orderedGovernanceVotesByAddressNo);

  const totalYesPower = simulatedYes.reduce(
    (sum, vote) => sum + vote.voteShort,
    0
  );
  const totalNoPower = simulatedNo.reduce(
    (sum, vote) => sum + vote.voteShort,
    0
  );
  const totalPower = totalYesPower + totalNoPower;

  const normalizeVotes = (
    votes: IGovernanceVoteByAddress[],
    bucketTotal: number
  ) =>
    votes
      .map((vote) => {
        const bucketShare =
          bucketTotal > 0 ? (vote.voteShort / bucketTotal) * 100 : 0;
        const totalShare =
          totalPower > 0 ? (vote.voteShort / totalPower) * 100 : 0;

        return {
          ...vote,
          share: Number.isFinite(bucketShare) ? bucketShare : 0,
          shareTotal: Number.isFinite(totalShare) ? totalShare : 0,
        };
      })
      .sort((a, b) => b.voteShort - a.voteShort);

  return {
    orderedGovernanceVotesByAddressYes: normalizeVotes(
      simulatedYes,
      totalYesPower
    ),
    orderedGovernanceVotesByAddressNo: normalizeVotes(
      simulatedNo,
      totalNoPower
    ),
    totalVotedYes: totalYesPower,
    totalVotedYesShort: totalYesPower,
    totalVotedNo: totalNoPower,
    totalVotedNoShort: totalNoPower,
    totalVoted: totalPower,
    totalVotedShort: totalPower,
  };
};

const computeHolderCategories = (
  dataset: IGovernanceVotesResponse | null,
  definitions: HolderCategoryDefinition[],
  { omitEmpty = false }: { omitEmpty?: boolean } = {}
): HolderCategoryStat[] | null => {
  if (!dataset) {
    return null;
  }

  type CategoryAccumulator = {
    yesPower: number;
    noPower: number;
    yesAddresses: Set<string>;
    noAddresses: Set<string>;
    allAddresses: Set<string>;
  };

  const categoryMap = new Map<string, CategoryAccumulator>();

  definitions.forEach((category) => {
    categoryMap.set(category.id, {
      yesPower: 0,
      noPower: 0,
      yesAddresses: new Set<string>(),
      noAddresses: new Set<string>(),
      allAddresses: new Set<string>(),
    });
  });

  const globalAddresses = new Set<string>();

  const registerVote = (
    vote: IGovernanceVoteByAddress,
    bucket: "yes" | "no"
  ) => {
    const votePower = Math.max(0, toNumber(vote.voteShort));
    const category = getCategoryByValue(votePower, definitions);
    const accumulator = categoryMap.get(category.id);

    if (!accumulator) {
      return;
    }

    if (bucket === "yes") {
      accumulator.yesPower += votePower;
      accumulator.yesAddresses.add(vote.address);
    } else {
      accumulator.noPower += votePower;
      accumulator.noAddresses.add(vote.address);
    }

    accumulator.allAddresses.add(vote.address);
    globalAddresses.add(vote.address);
  };

  dataset.orderedGovernanceVotesByAddressYes.forEach((vote) =>
    registerVote(vote, "yes")
  );
  dataset.orderedGovernanceVotesByAddressNo.forEach((vote) =>
    registerVote(vote, "no")
  );

  const totalYesVoters = dataset.orderedGovernanceVotesByAddressYes.length;
  const totalNoVoters = dataset.orderedGovernanceVotesByAddressNo.length;
  const totalUniqueVoters = globalAddresses.size;

  const totalYesPower = Math.max(0, toNumber(dataset.totalVotedYesShort));
  const totalNoPower = Math.max(0, toNumber(dataset.totalVotedNoShort));
  const totalPower = totalYesPower + totalNoPower;

  return definitions
    .map((category) => {
      const accumulator = categoryMap.get(category.id);

      if (!accumulator) {
        return {
          ...category,
          totalCount: 0,
          yesCount: 0,
          noCount: 0,
          totalVotePower: 0,
          yesVotePower: 0,
          noVotePower: 0,
          shareTotalVoters: 0,
          shareYesVoters: 0,
          shareNoVoters: 0,
          shareTotalPower: 0,
          shareYesPower: 0,
          shareNoPower: 0,
        };
      }

      const yesCount = accumulator.yesAddresses.size;
      const noCount = accumulator.noAddresses.size;
      const totalCount = accumulator.allAddresses.size;
      const yesVotePower = accumulator.yesPower;
      const noVotePower = accumulator.noPower;
      const combinedPower = yesVotePower + noVotePower;

      const shareTotalVoters =
        totalUniqueVoters > 0 ? (totalCount / totalUniqueVoters) * 100 : 0;
      const shareYesVoters =
        totalYesVoters > 0 ? (yesCount / totalYesVoters) * 100 : 0;
      const shareNoVoters =
        totalNoVoters > 0 ? (noCount / totalNoVoters) * 100 : 0;

      const shareTotalPower =
        totalPower > 0 ? (combinedPower / totalPower) * 100 : 0;
      const shareYesPower =
        totalYesPower > 0 ? (yesVotePower / totalYesPower) * 100 : 0;
      const shareNoPower =
        totalNoPower > 0 ? (noVotePower / totalNoPower) * 100 : 0;

      return {
        ...category,
        totalCount,
        yesCount,
        noCount,
        totalVotePower: combinedPower,
        yesVotePower,
        noVotePower,
        shareTotalVoters,
        shareYesVoters,
        shareNoVoters,
        shareTotalPower,
        shareYesPower,
        shareNoPower,
      };
    })
    .filter((category) => (omitEmpty ? category.totalCount > 0 : true));
};

const MetricCell = ({
  value,
  share,
  digits = 2,
}: {
  value: number;
  share: number;
  digits?: number;
}) => (
  <div className="flex flex-col items-end gap-0.5">
    <span className="font-semibold">{formatNumeric(value, digits)}</span>
    <span className="text-xs text-muted-foreground">
      {formatShare(Number.isFinite(share) ? share : 0)}
    </span>
  </div>
);

const VirtuosoTableScroller = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`overflow-y-auto overflow-x-auto scrollbar-thin ${className ?? ""}`}
    {...props}
  />
));
VirtuosoTableScroller.displayName = "VirtuosoTableScroller";

const VirtuosoTableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>((props, ref) => <tbody ref={ref} {...props} />);
VirtuosoTableBody.displayName = "VirtuosoTableBody";

const virtuosoTableComponents: TableComponents<IGovernanceVoteByAddress> = {
  Scroller: VirtuosoTableScroller,
  Table: ({ style, ...props }) => (
    <table
      style={style}
      className="w-full border-collapse text-sm"
      {...props}
    />
  ),
  TableHead: (props) => (
    <thead
      className="[&_tr]:border-b [&_th]:text-xs [&_th]:uppercase [&_th]:text-muted-foreground"
      {...props}
    />
  ),
  TableRow: (props) => (
    <tr
      className="border-b transition-colors hover:bg-muted/50"
      {...props}
    />
  ),
  TableBody: VirtuosoTableBody,
};

const VotesTable = ({
  title,
  description,
  icon,
  votes,
  accentColor,
  limit,
  virtualized = false,
  virtualizedHeight,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  votes: IGovernanceVoteByAddress[];
  accentColor: string;
  limit?: number;
  virtualized?: boolean;
  virtualizedHeight?: number;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const filteredVotes = useMemo(() => {
    if (!searchQuery.trim()) return votes;
    const query = searchQuery.toLowerCase();
    return votes.filter(
      (vote) =>
        vote.address.toLowerCase().includes(query) ||
        vote.herotag?.toLowerCase().includes(query)
    );
  }, [votes, searchQuery]);

  const total = filteredVotes.length;
  const displayCount = limit ? Math.min(total, limit) : total;
  const headerCaption = searchQuery
    ? `Found ${displayCount} of ${votes.length}`
    : limit
      ? `Showing top ${displayCount}`
      : `Total ${displayCount} ${displayCount === 1 ? "address" : "addresses"}`;
  const visibleVotes = limit ? filteredVotes.slice(0, limit) : filteredVotes;

  const handleCopy = useCallback(async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  }, []);

  const effectiveHeight = useMemo(() => {
    if (!virtualized) return undefined;
    const target = virtualizedHeight ?? 420;
    const rowsHeight =
      Math.max(visibleVotes.length, 1) * VIRTUALIZED_TABLE_ROW_HEIGHT;
    return Math.min(target, rowsHeight);
  }, [virtualized, virtualizedHeight, visibleVotes.length]);

  return (
    <GlassCard hover={false} solid className="p-0">
      <GlassCardHeader className="p-4 pb-2 space-y-3">
        <div className="flex flex-row items-start justify-between">
          <div>
            <GlassCardTitle className="flex items-center gap-2 text-lg">
              {icon}
              {title}
            </GlassCardTitle>
            <GlassCardDescription>{description}</GlassCardDescription>
          </div>
          <div className="text-xs text-muted-foreground">{headerCaption}</div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by address or herotag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-background/50"
          />
        </div>
      </GlassCardHeader>
      <GlassCardContent className="p-4 pt-0">
        {visibleVotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No votes recorded yet.</p>
        ) : !virtualized ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-xs text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Vote Power</TableHead>
                  <TableHead className="text-right">Bucket Share</TableHead>
                  <TableHead className="text-right">Global Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleVotes.map((vote, index) => (
                  <TableRow key={vote.address}>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          prefetch={false}
                          href={`https://explorer.multiversx.com/accounts/${vote.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary transition-colors hover:text-primary/80 hover:underline"
                          title={vote.address}
                        >
                          {vote.herotag ?? shortenAddress(vote.address, 4, 4)}
                        </Link>
                        <button
                          onClick={() => handleCopy(vote.address)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="Copy address"
                        >
                          <Copy className={`h-3 w-3 ${copiedAddress === vote.address ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {formatNumeric(vote.voteShort, 4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-muted-foreground">
                          {formatShare(vote.share)}
                        </span>
                        <div className="ml-auto h-2 w-24 overflow-hidden rounded-full bg-muted/50">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${toRatio(vote.share) * 100}%`,
                              background: accentColor === YES_COLOR
                                ? 'linear-gradient(90deg, #10B981, #34D399)'
                                : 'linear-gradient(90deg, #F43F5E, #FB7185)',
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-muted-foreground">
                          {formatShare(vote.shareTotal)}
                        </span>
                        <div className="ml-auto h-2 w-24 overflow-hidden rounded-full bg-muted/50">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${toRatio(vote.shareTotal) * 100}%`,
                              background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-xl border">
            <TableVirtuoso
              data={visibleVotes}
              style={{ height: effectiveHeight }}
              components={virtuosoTableComponents}
              fixedHeaderContent={() => (
                <tr className="bg-card shadow-sm">
                  <th className="w-12 px-2 py-2 text-left text-xs font-medium uppercase text-muted-foreground bg-card">
                    #
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase text-muted-foreground bg-card">
                    Address
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium uppercase text-muted-foreground bg-card">
                    Vote Power
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium uppercase text-muted-foreground bg-card">
                    Bucket Share
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium uppercase text-muted-foreground bg-card">
                    Global Share
                  </th>
                </tr>
              )}
              itemContent={(index, vote) => [
                <td
                  key="rank"
                  className="px-2 py-2 text-xs font-medium text-muted-foreground"
                >
                  {index + 1}
                </td>,
                <td key="address" className="px-2 py-2 font-mono text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <Link
                      prefetch={false}
                      href={`https://explorer.multiversx.com/accounts/${vote.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary transition-colors hover:text-primary/80 hover:underline"
                      title={vote.address}
                    >
                      {vote.herotag ?? shortenAddress(vote.address, 4, 4)}
                    </Link>
                    <button
                      onClick={() => handleCopy(vote.address)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Copy address"
                    >
                      <Copy className={`h-3 w-3 ${copiedAddress === vote.address ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    </button>
                  </div>
                </td>,
                <td key="power" className="px-2 py-2 text-right text-sm font-semibold">
                  {formatNumeric(vote.voteShort, 4)}
                </td>,
                <td key="bucket" className="px-2 py-2 text-right">
                  <div className="ml-auto flex max-w-[9rem] flex-col items-end gap-1">
                    <span className="text-sm text-muted-foreground">
                      {formatShare(vote.share)}
                    </span>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${toRatio(vote.share) * 100}%`,
                          background: accentColor === YES_COLOR
                            ? 'linear-gradient(90deg, #10B981, #34D399)'
                            : 'linear-gradient(90deg, #F43F5E, #FB7185)',
                        }}
                      />
                    </div>
                  </div>
                </td>,
                <td key="global" className="px-2 py-2 text-right">
                  <div className="ml-auto flex max-w-[9rem] flex-col items-end gap-1">
                    <span className="text-sm text-muted-foreground">
                      {formatShare(vote.shareTotal)}
                    </span>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${toRatio(vote.shareTotal) * 100}%`,
                          background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
                        }}
                      />
                    </div>
                  </div>
                </td>,
              ]}
            />
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
};

export default function GovernancePage() {
  const t = useTranslations();
  const [data, setData] = useState<IGovernanceVotesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<VoteMode>("current");

  const loadVotes = useCallback(
    async ({
      signal,
      isManual = false,
    }: { signal?: AbortSignal; isManual?: boolean } = {}) => {
      if (isManual) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const result = await governanceVotesService.getVotes(signal);

      if (signal?.aborted) {
        return;
      }

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error.message);
      }

      if (isManual) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    loadVotes({ signal: controller.signal }).catch((err) => {
      if (err instanceof Error && err.name === "AbortError") return;
      throw err;
    });

    return () => controller.abort();
  }, [loadVotes]);

  const handleRefresh = useCallback(() => {
    void loadVotes({ isManual: true });
  }, [loadVotes]);

  const quadraticData = useMemo(
    () => (data ? computeQuadraticSimulation(data) : null),
    [data]
  );

  useEffect(() => {
    if (activeMode === "quadratic" && !quadraticData) {
      setActiveMode("current");
    }
  }, [activeMode, quadraticData]);

  const activeDataset = useMemo(() => {
    if (activeMode === "quadratic") {
      return quadraticData ?? data;
    }
    return data;
  }, [activeMode, quadraticData, data]);

  const isQuadraticMode = activeMode === "quadratic";

  const handleModeChange = useCallback((value: string) => {
    setActiveMode(value === "quadratic" ? "quadratic" : "current");
  }, []);

  const aggregateStats = useMemo(() => {
    if (!activeDataset) {
      return null;
    }

    const total = toNumber(activeDataset.totalVotedShort);
    const yes = Math.max(0, toNumber(activeDataset.totalVotedYesShort));
    const no = Math.max(0, toNumber(activeDataset.totalVotedNoShort));

    const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
    const safeYes = Number.isFinite(yes) ? yes : 0;
    const safeNo = Number.isFinite(no) ? no : 0;

    return {
      total: {
        label: "Total Participation",
        value: activeDataset.totalVotedShort,
        share: 1,
      },
      yes: {
        label: "Support (YES)",
        value: activeDataset.totalVotedYesShort,
        share: safeTotal > 0 ? safeYes / safeTotal : 0,
      },
      no: {
        label: "Against (NO)",
        value: activeDataset.totalVotedNoShort,
        share: safeTotal > 0 ? safeNo / safeTotal : 0,
      },
    };
  }, [activeDataset]);

  const voteSplit = useMemo(() => {
    if (!aggregateStats) {
      return null;
    }
    const yesValue = toNumber(aggregateStats.yes.value);
    const noValue = toNumber(aggregateStats.no.value);
    const total = yesValue + noValue;
    return {
      total,
      data: [
        { name: "YES", value: yesValue, color: YES_COLOR },
        { name: "NO", value: noValue, color: NO_COLOR },
      ],
    };
  }, [aggregateStats]);

  const voteConcentration = useMemo(() => {
    if (!activeDataset) {
      return null;
    }

    const yesVotes = activeDataset.orderedGovernanceVotesByAddressYes;
    const noVotes = activeDataset.orderedGovernanceVotesByAddressNo;

    const sumShare = (votes: IGovernanceVoteByAddress[], amount: number) =>
      votes.slice(0, amount).reduce((acc, vote) => acc + vote.shareTotal, 0);

    const top10Yes = Math.min(100, Math.max(0, sumShare(yesVotes, 10)));
    const top10No = Math.min(100, Math.max(0, sumShare(noVotes, 10)));
    const others = Math.max(0, 100 - top10Yes - top10No);

    return {
      data: [
        { name: "Top 10 YES", value: top10Yes, color: YES_COLOR },
        { name: "Top 10 NO", value: top10No, color: NO_COLOR },
        { name: "Other voters", value: others, color: OTHER_COLOR },
      ],
      segments: {
        top10Yes: top10Yes / 100,
        top10No: top10No / 100,
        others: others / 100,
      },
      topShare: top10Yes + top10No,
    };
  }, [activeDataset]);

  const holderCategoryDefinitions = useMemo(
    () => getHolderCategoryDefinitions(activeMode),
    [activeMode]
  );

  const holderCategories = useMemo(
    () =>
      computeHolderCategories(activeDataset, holderCategoryDefinitions, {
        omitEmpty: isQuadraticMode,
      }),
    [activeDataset, holderCategoryDefinitions, isQuadraticMode]
  );

  const showInitialLoading = isLoading && !data && !error;

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            {t("nav.stakingRewards")}
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link
              href="/governance"
              className="text-foreground transition-colors"
            >
              {t("nav.governance")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || showInitialLoading}
            className="hidden sm:inline-flex"
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden relative">
        <GradientBackground intensity="subtle" />
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-24 md:pb-0 relative z-10">
          <AnimatedPage>
            <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-10 md:px-6 md:py-8">
              <FadeIn>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                      <span className="gradient-text">{t("governance.title")}</span>
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      {t("governance.description")}
                    </p>
                  </div>
                  <Tabs
                    value={activeMode}
                    onValueChange={handleModeChange}
                    className="w-full max-w-md"
                  >
                    <TabsList className="rounded-xl">
                      <TabsTrigger value="current" className="rounded-lg">
                        {t("governance.modes.live")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="quadratic"
                        disabled={!quadraticData}
                        className="rounded-lg"
                      >
                        {t("governance.modes.quadratic")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {isQuadraticMode ? (
                    <p className="text-xs text-muted-foreground">
                      Vote power is re-weighted using square-root scaling to
                      illustrate a quadratic voting outcome.
                    </p>
                  ) : null}
                </div>
              </FadeIn>

              {showInitialLoading && (
                <div className="grid gap-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-32 w-full rounded-2xl" />
                    ))}
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <Skeleton key={index} className="h-64 w-full rounded-2xl" />
                    ))}
                  </div>
                </div>
              )}

              {!showInitialLoading && error && (
                <GlassCard hover={false} solid className="border-destructive/30 bg-destructive/5">
                  <GlassCardHeader>
                    <GlassCardTitle className="text-destructive">
                      {t("governance.failedToLoad")}
                    </GlassCardTitle>
                    <GlassCardDescription>{error}</GlassCardDescription>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <Button
                      onClick={handleRefresh}
                      variant="destructive"
                      disabled={isRefreshing}
                    >
                      <RefreshCcw
                        className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                      />
                      {t("common.tryAgain")}
                    </Button>
                  </GlassCardContent>
                </GlassCard>
              )}

              {!showInitialLoading && data && activeDataset && aggregateStats && (
                <div className="space-y-6">
                  {/* Hero Vote Progress Bar */}
                  <FadeIn>
                    <GlassCard solid hover={false} className="overflow-hidden">
                      <GlassCardContent className="p-0 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-emerald-500">{formatRatio(aggregateStats.yes.share)}</p>
                              <p className="text-xs text-muted-foreground">YES votes leading</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatNumeric(aggregateStats.total.value, 0)}</p>
                            <p className="text-xs text-muted-foreground">Total Vote Power</p>
                          </div>
                        </div>
                        <div className="relative h-4 rounded-full overflow-hidden bg-rose-500/20">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                            style={{ width: `${aggregateStats.yes.share * 100}%` }}
                          />
                          <div
                            className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-500 to-rose-400 rounded-full transition-all duration-700"
                            style={{ width: `${aggregateStats.no.share * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">YES: {formatNumeric(aggregateStats.yes.value, 0)}</span>
                            <span className="text-xs text-muted-foreground">({(activeDataset?.orderedGovernanceVotesByAddressYes?.length ?? 0).toLocaleString()} voters)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">({(activeDataset?.orderedGovernanceVotesByAddressNo?.length ?? 0).toLocaleString()} voters)</span>
                            <span className="text-muted-foreground">NO: {formatNumeric(aggregateStats.no.value, 0)}</span>
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  </FadeIn>

                  <StaggerContainer className="grid gap-4 md:grid-cols-3">
                    <StaggerItem>
                      <GlassCard solid className="h-full">
                        <GlassCardContent className="space-y-3 p-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              Total Vote Power
                            </span>
                            <span className="text-[11px] uppercase text-muted-foreground">
                              YES + NO
                            </span>
                          </div>
                          <div className="text-2xl font-bold">
                            {formatNumeric(aggregateStats.total.value)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Combined participation across all recorded ballots.
                          </p>
                        </GlassCardContent>
                      </GlassCard>
                    </StaggerItem>
                    <StaggerItem>
                      <GlassCard solid className="h-full border-emerald-500/20">
                        <GlassCardContent className="space-y-3 p-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              YES Vote Power
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="text-2xl font-bold text-emerald-500">
                            {formatNumeric(aggregateStats.yes.value)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatRatio(aggregateStats.yes.share)} of total vote power
                          </p>
                        </GlassCardContent>
                      </GlassCard>
                    </StaggerItem>
                    <StaggerItem>
                      <GlassCard solid className="h-full border-rose-500/20">
                        <GlassCardContent className="space-y-3 p-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              NO Vote Power
                            </span>
                            <XCircle className="h-4 w-4 text-rose-500" />
                          </div>
                          <div className="text-2xl font-bold text-rose-500">
                            {formatNumeric(aggregateStats.no.value)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatRatio(aggregateStats.no.share)} of total vote power
                          </p>
                        </GlassCardContent>
                      </GlassCard>
                    </StaggerItem>
                  </StaggerContainer>

                  <FadeIn delay={0.2}>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <GlassCard solid hover={false}>
                        <GlassCardHeader className="p-0 pb-4">
                          <GlassCardTitle className="text-base">
                            Vote Power Split
                          </GlassCardTitle>
                          <GlassCardDescription className="text-xs">
                            Total vote power across recorded YES and NO ballots
                          </GlassCardDescription>
                        </GlassCardHeader>
                        <GlassCardContent className="flex flex-col gap-4 p-0 md:flex-row md:items-center md:justify-between">
                          <DonutChart
                            data={voteSplit?.data ?? []}
                            centerTitle="Total"
                            centerValue={formatNumeric(voteSplit?.total ?? 0)}
                          />
                          <DonutLegend
                            items={[
                              {
                                label: "YES",
                                primary: formatNumeric(aggregateStats.yes.value),
                                secondary: `${formatRatio(aggregateStats.yes.share)} of total`,
                                color: YES_COLOR,
                              },
                              {
                                label: "NO",
                                primary: formatNumeric(aggregateStats.no.value),
                                secondary: `${formatRatio(aggregateStats.no.share)} of total`,
                                color: NO_COLOR,
                              },
                            ]}
                          />
                        </GlassCardContent>
                      </GlassCard>

                      <GlassCard solid hover={false}>
                        <GlassCardHeader className="p-0 pb-4">
                          <GlassCardTitle className="text-base">
                            Vote Concentration
                          </GlassCardTitle>
                          <GlassCardDescription className="text-xs">
                            Top 10 vote holders compared with the rest
                          </GlassCardDescription>
                        </GlassCardHeader>
                        <GlassCardContent className="flex flex-col gap-4 p-0 md:flex-row md:items-center md:justify-between">
                          <DonutChart
                            data={voteConcentration?.data ?? []}
                            centerTitle="Top 10"
                            centerValue={formatShare(
                              voteConcentration?.topShare ?? 0
                            )}
                          />
                          <DonutLegend
                            items={[
                              {
                                label: "Top 10 YES",
                                primary: formatShare(
                                  (voteConcentration?.segments?.top10Yes ?? 0) *
                                    100
                                ),
                                color: YES_COLOR,
                              },
                              {
                                label: "Top 10 NO",
                                primary: formatShare(
                                  (voteConcentration?.segments?.top10No ?? 0) *
                                    100
                                ),
                                color: NO_COLOR,
                              },
                              {
                                label: "Other voters",
                                primary: formatShare(
                                  (voteConcentration?.segments?.others ?? 0) *
                                    100
                                ),
                                color: OTHER_COLOR,
                              },
                            ]}
                          />
                        </GlassCardContent>
                      </GlassCard>
                    </div>
                  </FadeIn>

                  {holderCategories && holderCategories.length > 0 ? (
                    <FadeIn delay={0.3}>
                      <GlassCard solid hover={false} className="p-0 overflow-hidden">
                        <GlassCardHeader className="p-4 pb-2">
                          <GlassCardTitle className="text-base">
                            Holder Distribution
                          </GlassCardTitle>
                          <GlassCardDescription className="text-xs">
                            Voter counts and vote power share grouped by EGLD
                            buckets
                          </GlassCardDescription>
                        </GlassCardHeader>
                        <GlassCardContent className="p-0">
                          <div className="overflow-x-auto">
                            <Table className="min-w-[760px] text-sm">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Category</TableHead>
                                  <TableHead className="text-right">
                                    Total Wallets
                                  </TableHead>
                                  <TableHead className="text-right">
                                    YES Wallets
                                  </TableHead>
                                  <TableHead className="text-right">
                                    NO Wallets
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Total Vote Power
                                  </TableHead>
                                  <TableHead className="text-right">
                                    YES Vote Power
                                  </TableHead>
                                  <TableHead className="text-right">
                                    NO Vote Power
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {holderCategories.map((category) => (
                                  <TableRow key={category.id}>
                                    <TableCell className="whitespace-nowrap font-medium">
                                      {category.label}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <MetricCell
                                        value={category.totalCount}
                                        share={category.shareTotalVoters}
                                        digits={0}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <MetricCell
                                        value={category.yesCount}
                                        share={category.shareYesVoters}
                                        digits={0}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <MetricCell
                                        value={category.noCount}
                                        share={category.shareNoVoters}
                                        digits={0}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <MetricCell
                                        value={category.totalVotePower}
                                        share={category.shareTotalPower}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <MetricCell
                                        value={category.yesVotePower}
                                        share={category.shareYesPower}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <MetricCell
                                        value={category.noVotePower}
                                        share={category.shareNoPower}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </GlassCardContent>
                      </GlassCard>
                    </FadeIn>
                  ) : null}

                  <FadeIn delay={0.4}>
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-lg font-semibold">All Votes</h2>
                        <p className="text-sm text-muted-foreground">
                          Full breakdown of every address participating in the
                          current governance vote.
                        </p>
                      </div>
                      <div className="grid gap-6 lg:grid-cols-2">
                        <VotesTable
                          title="All YES Voters"
                          description="Complete list ordered by vote power contribution."
                          icon={
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          }
                          votes={
                            activeDataset?.orderedGovernanceVotesByAddressYes ??
                            []
                          }
                          accentColor={YES_COLOR}
                          virtualized
                          virtualizedHeight={480}
                        />
                        <VotesTable
                          title="All NO Voters"
                          description="Complete list ordered by vote power contribution."
                          icon={<XCircle className="h-5 w-5 text-rose-500" />}
                          votes={
                            activeDataset?.orderedGovernanceVotesByAddressNo ??
                            []
                          }
                          accentColor={NO_COLOR}
                          virtualized
                          virtualizedHeight={480}
                        />
                      </div>
                    </div>
                  </FadeIn>
                </div>
              )}
            </section>
          </AnimatedPage>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
