import { useCallback, useRef, useState } from "react";
import RealtimeToast from "../components/common/RealtimeToast";
import BrandLogo from "../components/common/BrandLogo";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import DiamondMenu from "../components/navigation/DiamondMenu";
import HeartMenu from "../components/navigation/HeartMenu";
import MoreMenu from "../components/navigation/MoreMenu";
import SidebarIcon from "../components/navigation/SidebarIcon";
import type { SidebarIconName } from "../components/navigation/SidebarIcon";
import { useAuth } from "../hooks/useAuth";
import { useHorizontalSwipe } from "../hooks/useHorizontalSwipe";
import { getLevelInfo } from "../utils/level-calculator";
import "./LearningLayout.css";

interface NavigationItem {
  to: string;
  label: string;
  icon: SidebarIconName;
}

const baseNavigationItems: NavigationItem[] = [
  { to: "/learn", label: "HỌC", icon: "learn" },
  {
    to: "/vocabularies/learned",
    label: "TỪ VỰNG ĐÃ HỌC",
    icon: "vocabulary",
  },
  { to: "/shop", label: "CỬA HÀNG", icon: "shop" },
  { to: "/profile", label: "HỒ SƠ", icon: "profile" },
];

type StageDirection = "forward" | "back" | "none";

function isTabActive(to: string, pathname: string) {
  if (to === "/learn") {
    return pathname === "/learn" || pathname.startsWith("/learn/");
  }
  if (to === "/vocabularies/learned") {
    return pathname.startsWith("/vocabularies/") || pathname === "/vocabulary";
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

function getTabIndex(pathname: string) {
  return baseNavigationItems.findIndex((item) => isTabActive(item.to, pathname));
}

/** Slide new pages in from the side the user is "moving" towards. */
function getStageDirection(from: string, to: string): StageDirection {
  const fromTab = getTabIndex(from);
  const toTab = getTabIndex(to);
  if (fromTab !== -1 && toTab !== -1 && fromTab !== toTab) {
    return toTab > fromTab ? "forward" : "back";
  }
  const depth = (path: string) => path.split("/").filter(Boolean).length;
  if (depth(to) > depth(from)) return "forward";
  if (depth(to) < depth(from)) return "back";
  return "none";
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.2 2.5c.5 4.2-3.8 5.5-3.1 9.1.2 1 .8 1.8 1.7 2.4-.1-2 .9-3.5 2.6-4.7 2.4 2 3.6 4.2 3.3 6.8-.3 3.5-2.8 5.6-6 5.4-3.9-.2-6.3-3-5.7-6.9.7-4.6 5-6.7 7.2-12.1Z" />
    </svg>
  );
}

function XpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M13 2L3 14h7v8l10-12h-7V2z" />
    </svg>
  );
}

export default function LearningLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const isLessonRoute = location.pathname.startsWith("/learn/lessons/");
  const [stage, setStage] = useState<{ path: string; direction: StageDirection }>({
    path: location.pathname,
    direction: "none",
  });

  if (stage.path !== location.pathname) {
    setStage({
      path: location.pathname,
      direction: getStageDirection(stage.path, location.pathname),
    });
  }

  // On phones, swiping left/right on a main tab moves to the neighbouring tab.
  const currentTabIndex = baseNavigationItems.findIndex(
    (item) => item.to === location.pathname,
  );
  const goToTab = useCallback(
    (offset: number) => {
      const next = baseNavigationItems[currentTabIndex + offset];
      if (currentTabIndex !== -1 && next) navigate(next.to);
    },
    [currentTabIndex, navigate],
  );
  useHorizontalSwipe(workspaceRef, {
    enabled: !isLessonRoute && currentTabIndex !== -1,
    threshold: 80,
    onSwipeLeft: () => goToTab(1),
    onSwipeRight: () => goToTab(-1),
  });

  const totalXp = user?.stats.totalXp ?? 0;
  const levelInfo = getLevelInfo(totalXp);

  const checkIsActive = (to: string) => isTabActive(to, location.pathname);

  return (
    <div
      className={`learning-shell${isLessonRoute ? " learning-shell--lesson" : ""}`}
    >
      <RealtimeToast />
      <aside className="learning-sidebar">
        <NavLink className="app-brand" to="/learn" aria-label="LingoFox - Học">
          <BrandLogo />
        </NavLink>

        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          {baseNavigationItems.map((item) => (
            <div key={item.to} className="relative flex flex-col">
              <NavLink
                className={() =>
                  `sidebar-link${checkIsActive(item.to) ? " sidebar-link--active" : ""}`
                }
                to={item.to}
              >
                <span className={`sidebar-icon sidebar-icon--${item.icon}`}>
                  <SidebarIcon name={item.icon} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            </div>
          ))}
          <MoreMenu onLogout={logout} />
        </nav>
      </aside>

      <div className="learning-workspace" ref={workspaceRef}>
        <header className="stats-navbar" aria-label="Thông tin học tập">
          <div className="stats-navbar__inner">

            <div
              className="stat-item stat-item--level"
              title={`Cấp độ ${levelInfo.level} • ${levelInfo.xpInCurrentLevel}/${levelInfo.xpRequiredForLevel} XP để lên Cấp ${levelInfo.level + 1}`}
            >
              <XpIcon />
              <div className="stat-level-info">
                <strong className="stat-level-num">
                  Lv. {levelInfo.level}
                </strong>
                <span className="stat-level-xp">
                  {levelInfo.xpInCurrentLevel}/{levelInfo.xpRequiredForLevel} XP
                </span>
              </div>
            </div>
            <div className="stat-item stat-item--streak" title="Chuỗi ngày học">
              <FlameIcon />
              <strong>{user?.stats.currentStreak ?? 0}</strong>
            </div>
            <DiamondMenu diamond={user?.stats.diamond ?? 0} />
            <HeartMenu
              currentHeart={user?.stats.currentHeart ?? 0}
              maxHeart={user?.stats.maxHeart ?? 0}
              nextHeartAt={user?.stats.nextHeartAt ?? null}
            />
          </div>
        </header>

        <div
          key={isLessonRoute ? "lesson" : location.pathname}
          className={`learning-columns${isLessonRoute ? "" : " route-stage"}`}
          data-direction={stage.direction}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
