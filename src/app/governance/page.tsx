/**
 * @file page.tsx
 * @description Governance votes dashboard draft page.
 * @module app/governance
 */

"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
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
}

const DonutChart = ({
  data,
  centerTitle,
  centerValue,
  size = 180,
}: {
  data: DonutSegment[];
  centerTitle: string;
  centerValue: string;
  size?: number;
}) => (
  <div
    className="relative mx-auto"
    style={{ width: size, height: size }}
  >
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          outerRadius="90%"
          stroke="none"
        >
          {data.map((segment) => (
            <Cell key={segment.name} fill={segment.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {centerTitle}
      </span>
      <span className="text-base font-semibold">{centerValue}</span>
    </div>
  </div>
);

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
      <div key={item.label} className="flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-2.5 py-2">
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
  { id: "gte50k", label: ">= 50,000 EGLD", min: 50000, max: Number.POSITIVE_INFINITY },
];

const HOLDER_CATEGORIES_SIMULATION: HolderCategoryDefinition[] = [
  { id: "lt10", label: "< 10 EGLD", min: 0, max: 10 },
  { id: "10to100", label: "10 - < 100 EGLD", min: 10, max: 100 },
  { id: "100to1000", label: "100 - < 1,000 EGLD", min: 100, max: 1000 },
  { id: "1kto5k", label: "1,000 - < 5,000 EGLD", min: 1000, max: 5000 },
  { id: "5kto10k", label: "5,000 - < 10,000 EGLD", min: 5000, max: 10000 },
  { id: "gte10k", label: ">= 10,000 EGLD", min: 10000, max: Number.POSITIVE_INFINITY },
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

  return definitions.map((category) => {
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
  }).filter((category) => (omitEmpty ? category.totalCount > 0 : true));
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
    className={`overflow-y-auto overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted ${className ?? ""}`}
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
  const total = votes.length;
  const displayCount = limit ? Math.min(total, limit) : total;
  const headerCaption = limit
    ? `Showing top ${displayCount}`
    : `Total ${displayCount} ${displayCount === 1 ? "address" : "addresses"}`;
  const visibleVotes = limit ? votes.slice(0, limit) : votes;

  const effectiveHeight = useMemo(() => {
    if (!virtualized) return undefined;
    const target = virtualizedHeight ?? 420;
    const rowsHeight = Math.max(visibleVotes.length, 1) * VIRTUALIZED_TABLE_ROW_HEIGHT;
    return Math.min(target, rowsHeight);
  }, [virtualized, virtualizedHeight, visibleVotes.length]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="text-xs text-muted-foreground">{headerCaption}</div>
      </CardHeader>
      <CardContent>
        {visibleVotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No votes recorded yet.
          </p>
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
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {formatNumeric(vote.voteShort, 4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-muted-foreground">
                          {formatShare(vote.share)}
                        </span>
                        <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${toRatio(vote.share) * 100}%`,
                              backgroundColor: accentColor,
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
                        <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{
                              width: `${toRatio(vote.shareTotal) * 100}%`,
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
          <div className="rounded-lg border">
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
                </td>,
                <td key="power" className="px-2 py-2 text-right text-sm font-semibold">
                  {formatNumeric(vote.voteShort, 4)}
                </td>,
                <td key="bucket" className="px-2 py-2 text-right">
                  <div className="ml-auto flex max-w-[9rem] flex-col items-end gap-1">
                    <span className="text-sm text-muted-foreground">
                      {formatShare(vote.share)}
                    </span>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${toRatio(vote.share) * 100}%`,
                          backgroundColor: accentColor,
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
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{
                          width: `${toRatio(vote.shareTotal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>,
              ]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function GovernancePage() {
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

  const insights = useMemo(() => {
    if (!activeDataset) {
      return null;
    }

    const yesVotes = activeDataset.orderedGovernanceVotesByAddressYes;
    const noVotes = activeDataset.orderedGovernanceVotesByAddressNo;
    const uniqueAddresses = new Set<string>();

    yesVotes.forEach((vote) => uniqueAddresses.add(vote.address));
    noVotes.forEach((vote) => uniqueAddresses.add(vote.address));

    const sumShare = (votes: IGovernanceVoteByAddress[], amount: number) =>
      votes.slice(0, amount).reduce((acc, vote) => acc + vote.shareTotal, 0);

    const sumBucketShare = (
      votes: IGovernanceVoteByAddress[],
      amount: number
    ) => votes.slice(0, amount).reduce((acc, vote) => acc + vote.share, 0);

    return {
      uniqueVoters: uniqueAddresses.size,
      totalYesVoters: yesVotes.length,
      totalNoVoters: noVotes.length,
      yesTop: yesVotes[0] ?? null,
      noTop: noVotes[0] ?? null,
      yesTop10GlobalShare: sumShare(yesVotes, 10),
      noTop10GlobalShare: sumShare(noVotes, 10),
      yesTop5BucketShare: sumBucketShare(yesVotes, 5),
      noTop5BucketShare: sumBucketShare(noVotes, 5),
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
    if (!insights) {
      return null;
    }
    const top10Yes = Math.min(100, Math.max(0, insights.yesTop10GlobalShare));
    const top10No = Math.min(100, Math.max(0, insights.noTop10GlobalShare));
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
  }, [insights]);

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
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            Staking Rewards
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link
              href="/governance"
              className="text-foreground transition-colors"
            >
              Governance
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
              className={`mr-2 h-4 w-4 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-10 md:px-6 md:py-8">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Governance Participation
                </h1>
                <p className="text-sm text-muted-foreground">
                  Monitor how stakeholders are voting across YES and NO buckets.
                </p>
              </div>
              <Tabs
                value={activeMode}
                onValueChange={handleModeChange}
                className="w-full max-w-md"
              >
                <TabsList>
                  <TabsTrigger value="current">Live Totals</TabsTrigger>
                  <TabsTrigger value="quadratic" disabled={!quadraticData}>
                    Quadratic Simulation
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

            {showInitialLoading && (
              <div className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-32 w-full" />
                  ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={index} className="h-64 w-full" />
                  ))}
                </div>
              </div>
            )}

            {!showInitialLoading && error && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Failed to load governance data
                  </CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleRefresh}
                    variant="destructive"
                    disabled={isRefreshing}
                  >
                    <RefreshCcw
                      className={`mr-2 h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {!showInitialLoading && data && activeDataset && aggregateStats && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          Total Vote Power
                        </span>
                        <span className="text-[11px] uppercase text-muted-foreground">
                          YES + NO
                        </span>
                      </div>
                      <div className="text-2xl font-semibold">
                        {formatNumeric(aggregateStats.total.value)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Combined participation across all recorded ballots.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          YES Vote Power
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="text-2xl font-semibold text-emerald-600">
                        {formatNumeric(aggregateStats.yes.value)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatRatio(aggregateStats.yes.share)} of total vote
                        power
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          NO Vote Power
                        </span>
                        <XCircle className="h-4 w-4 text-rose-500" />
                      </div>
                      <div className="text-2xl font-semibold text-rose-500">
                        {formatNumeric(aggregateStats.no.value)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatRatio(aggregateStats.no.share)} of total vote
                        power
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">Vote Power Split</CardTitle>
                      <CardDescription className="text-xs">
                        Total vote power across recorded YES and NO ballots
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 p-4 pt-0 md:flex-row md:items-center md:justify-between">
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
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">Vote Concentration</CardTitle>
                      <CardDescription className="text-xs">
                        Top 10 vote holders compared with the rest
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 p-4 pt-0 md:flex-row md:items-center md:justify-between">
                      <DonutChart
                        data={voteConcentration?.data ?? []}
                        centerTitle="Top 10"
                        centerValue={formatShare(voteConcentration?.topShare ?? 0)}
                      />
                      <DonutLegend
                        items={[
                          {
                            label: "Top 10 YES",
                            primary: formatShare(
                              (voteConcentration?.segments?.top10Yes ?? 0) * 100
                            ),
                            color: YES_COLOR,
                          },
                          {
                            label: "Top 10 NO",
                            primary: formatShare(
                              (voteConcentration?.segments?.top10No ?? 0) * 100
                            ),
                            color: NO_COLOR,
                          },
                          {
                            label: "Other voters",
                            primary: formatShare(
                              (voteConcentration?.segments?.others ?? 0) * 100
                            ),
                            color: OTHER_COLOR,
                          },
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>

                {holderCategories && holderCategories.length > 0 ? (
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">
                        Holder Distribution
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Voter counts and vote power share grouped by EGLD buckets
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
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
                    </CardContent>
                  </Card>
                ) : null}

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
                      icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      votes={
                        activeDataset?.orderedGovernanceVotesByAddressYes ?? []
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
                        activeDataset?.orderedGovernanceVotesByAddressNo ?? []
                      }
                      accentColor={NO_COLOR}
                      virtualized
                      virtualizedHeight={480}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
