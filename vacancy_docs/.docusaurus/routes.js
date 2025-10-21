import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'ca2'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '49e'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '8c9'),
            routes: [
              {
                path: '/admin/management',
                component: ComponentCreator('/admin/management', '104'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/admin/panel',
                component: ComponentCreator('/admin/panel', '0eb'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/support',
                component: ComponentCreator('/support', 'd68'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/system/algorithm',
                component: ComponentCreator('/system/algorithm', '6fe'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/system/components',
                component: ComponentCreator('/system/components', 'c6f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/system/logic',
                component: ComponentCreator('/system/logic', '3d6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/system/overview',
                component: ComponentCreator('/system/overview', 'ce4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/user/interface',
                component: ComponentCreator('/user/interface', '221'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/user/messages',
                component: ComponentCreator('/user/messages', '117'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/user/usage',
                component: ComponentCreator('/user/usage', '2c6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', 'fc9'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
