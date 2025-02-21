import React, { Fragment, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Tab } from "@headlessui/react";
// services
import analyticsService from "services/analytics.service";
import projectService from "services/project.service";
import cyclesService from "services/cycles.service";
import modulesService from "services/modules.service";
// components
import { CustomAnalytics, ScopeAndDemand } from "components/analytics";
// icons
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
// types
import { IAnalyticsParams } from "types";
// fetch-keys
import { ANALYTICS, CYCLE_DETAILS, MODULE_DETAILS, PROJECT_DETAILS } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

const tabsList = ["Scope and Demand", "Custom Analytics"];

export const AnalyticsProjectModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [fullScreen, setFullScreen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { control, watch, setValue } = useForm<IAnalyticsParams>({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: projectId ? [projectId.toString()] : watch("project"),
    cycle: cycleId ? cycleId.toString() : null,
    module: moduleId ? moduleId.toString() : null,
  };

  const { data: analytics, error: analyticsError } = useSWR(
    workspaceSlug ? ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getAnalytics(workspaceSlug.toString(), params) : null
  );

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId && !(cycleId || moduleId)
      ? PROJECT_DETAILS(projectId.toString())
      : null,
    workspaceSlug && projectId && !(cycleId || moduleId)
      ? () => projectService.getProject(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const { data: cycleDetails } = useSWR(
    workspaceSlug && projectId && cycleId ? CYCLE_DETAILS(cycleId.toString()) : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cyclesService.getCycleDetails(
            workspaceSlug.toString(),
            projectId.toString(),
            cycleId.toString()
          )
      : null
  );

  const { data: moduleDetails } = useSWR(
    workspaceSlug && projectId && moduleId ? MODULE_DETAILS(moduleId.toString()) : null,
    workspaceSlug && projectId && moduleId
      ? () =>
          modulesService.getModuleDetails(
            workspaceSlug.toString(),
            projectId.toString(),
            moduleId.toString()
          )
      : null
  );

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className={`absolute top-0 z-30 h-full bg-brand-surface-1 ${
        fullScreen ? "p-2 w-full" : "w-1/2"
      } ${isOpen ? "right-0" : "-right-full"} duration-300 transition-all`}
    >
      <div
        className={`flex h-full flex-col overflow-hidden border-brand-base bg-brand-base text-left ${
          fullScreen ? "rounded-lg border" : "border-l"
        }`}
      >
        <div className="flex items-center justify-between gap-4 bg-brand-base px-5 py-4 text-sm">
          <h3 className="break-all">
            Analytics for{" "}
            {cycleId ? cycleDetails?.name : moduleId ? moduleDetails?.name : projectDetails?.name}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid place-items-center p-1 text-brand-secondary hover:text-brand-base"
              onClick={() => setFullScreen((prevData) => !prevData)}
            >
              {fullScreen ? (
                <ArrowsPointingInIcon className="h-4 w-4" />
              ) : (
                <ArrowsPointingOutIcon className="h-3 w-3" />
              )}
            </button>
            <button
              type="button"
              className="grid place-items-center p-1 text-brand-secondary hover:text-brand-base"
              onClick={handleClose}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Tab.Group as={Fragment}>
          <Tab.List as="div" className="space-x-2 border-b border-brand-base p-5 pt-0">
            {tabsList.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `rounded-3xl border border-brand-base px-4 py-2 text-xs hover:bg-brand-surface-2 ${
                    selected ? "bg-brand-surface-2" : ""
                  }`
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          {/* <h4 className="p-5 pb-0">Analytics for</h4> */}
          <Tab.Panels as={Fragment}>
            <Tab.Panel as={Fragment}>
              <ScopeAndDemand fullScreen={fullScreen} />
            </Tab.Panel>
            <Tab.Panel as={Fragment}>
              <CustomAnalytics
                analytics={analytics}
                analyticsError={analyticsError}
                params={params}
                control={control}
                setValue={setValue}
                fullScreen={fullScreen}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};
