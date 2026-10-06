"use client";

import React from 'react';
import NextLink from 'next/link';
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation';

export function Link({ to, href, replace, children, className, style, onClick, ...props }) {
  const target = href || to || '#';
  return (
    <NextLink
      href={target}
      replace={replace}
      className={className}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </NextLink>
  );
}

export function NavLink({ to, href, className, children, end, ...props }) {
  const pathname = usePathname() || '';
  const target = href || to || '#';
  const isActive = end
    ? pathname === target
    : (pathname === target || (target !== '/' && pathname.startsWith(target)));
  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <NextLink href={target} className={resolvedClass} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return React.useCallback((to, options = {}) => {
    if (typeof to === 'number') {
      if (to === -1) {
        router.back();
      } else if (to === 1) {
        router.forward();
      }
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [router]);
}

export function useLocation() {
  const pathname = usePathname() || '/';
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearch(window.location.search || '');
    }
  }, [pathname]);

  return {
    pathname,
    search,
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null,
  };
}

export function useParams() {
  return useNextParams() || {};
}

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = React.useCallback((nextParams, options = {}) => {
    const params = new URLSearchParams(nextParams);
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [pathname, router]);

  return [searchParams, setSearchParams];
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  React.useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  return null;
}

export function Outlet({ children }) {
  return children || null;
}

export default {
  Link,
  NavLink,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  Navigate,
  Outlet,
};
