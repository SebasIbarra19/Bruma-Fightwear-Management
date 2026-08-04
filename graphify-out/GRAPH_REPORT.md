# Graph Report - src  (2026-08-02)

## Corpus Check
- 179 files · ~67,823 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 945 nodes · 1874 edges · 64 communities (55 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- CRUD API Routes
- Accordion & Avatar UI
- Input & Sheet UI
- Auth & Command UI
- Inventory Alert API
- Inventory & Supplier UI
- Customers Page UI
- Advanced Form Fields
- Dashboard View
- App Layout & Theme
- Badge & Checkbox UI
- Alert Dialog UI
- Error Handling
- Catalog API & Data
- Data Access Types
- Categories API
- Dashboard Grid Types
- Invoicing Page
- Response Builder
- Context Menu UI
- Dropdown Menu UI
- Products API
- Carousel UI
- Form Field UI
- Orders Data Hook
- Purchase Order Detail
- Variants Data Hook
- Utility Functions
- Inventory Page UI
- Inventory Movements
- Chart UI
- Drawer UI
- Select UI
- Product Lines Hook
- Orders API & Adapter
- Navigation Menu UI
- Customers Data Hook
- Inventory Data Types
- Supabase Service
- Theme Definitions
- Customers Adapter
- Inventory API Handlers
- Purchase Orders Hook
- Catalog Page UI
- Reporting & Audit
- API Adapter Types
- Alert UI
- Input OTP UI
- Popover UI
- Categories Data Hook
- Modern Table Demo
- Project Context
- Auth Middleware

## God Nodes (most connected - your core abstractions)
1. `cn()` - 216 edges
2. `useTheme()` - 34 edges
3. `SupabaseServiceClient` - 24 edges
4. `ApiResponse` - 23 edges
5. `Button()` - 20 edges
6. `InventoryAdapter` - 20 edges
7. `createClient()` - 19 edges
8. `withErrorHandling()` - 18 edges
9. `useAuth()` - 16 edges
10. `ValidationError` - 15 edges

## Surprising Connections (you probably didn't know these)
- `DashboardView()` --calls--> `createClient()`  [EXTRACTED]
  app/(admin)/dashboard/page.tsx → lib/supabase/client.ts
- `InventoryView()` --calls--> `createClient()`  [EXTRACTED]
  app/(admin)/inventory/page.tsx → lib/supabase/client.ts
- `GET()` --calls--> `withErrorHandling()`  [EXTRACTED]
  app/api/inventory/items/[id]/route.ts → lib/api/middleware.ts
- `AuthContainer()` --calls--> `useTheme()`  [EXTRACTED]
  components/auth/AuthContainer.tsx → contexts/ThemeContext.tsx
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  components/auth/ProtectedRoute.tsx → contexts/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (64 total, 9 thin omitted)

### Community 0 - "CRUD API Routes"
Cohesion: 0.05
Nodes (61): ProfilePage(), DataTestPage(), ProtectedRoute(), ProtectedRouteProps, AppLayout(), AppLayoutProps, renderFunctionalBreadcrumbs(), DashboardLayoutProps (+53 more)

### Community 1 - "Accordion & Avatar UI"
Cohesion: 0.06
Nodes (38): AccordionContent(), AccordionItem(), AccordionTrigger(), Avatar(), AvatarFallback(), AvatarImage(), BreadcrumbEllipsis(), BreadcrumbItem() (+30 more)

### Community 2 - "Input & Sheet UI"
Cohesion: 0.05
Nodes (41): Input(), Separator(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay() (+33 more)

### Community 3 - "Auth & Command UI"
Cohesion: 0.07
Nodes (34): AuthContainerProps, Command(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator(), CommandShortcut() (+26 more)

### Community 4 - "Inventory Alert API"
Cohesion: 0.10
Nodes (21): POST, GET, getInventoryAlertsHandler(), GET(), getInventoryItemByIdHandler(), GET, getInventoryItemsHandler(), GET (+13 more)

### Community 5 - "Inventory & Supplier UI"
Cohesion: 0.11
Nodes (19): getSuppliersHandler(), InventoryForm(), InventoryFormProps, InventoryList(), InventoryListProps, useInventory(), Product, ProductVariant (+11 more)

### Community 6 - "Customers Page UI"
Cohesion: 0.11
Nodes (16): Customer, CustomersView(), MovementsView(), Supplier, SuppliersView(), ProjectDebugPage(), AuthContainer(), LoginForm() (+8 more)

### Community 7 - "Advanced Form Fields"
Cohesion: 0.11
Nodes (25): CheckboxField, CheckboxFieldProps, DateField, DateFieldProps, FileField, FileFieldProps, RadioGroupField(), RadioGroupFieldProps (+17 more)

### Community 8 - "Dashboard View"
Cohesion: 0.14
Nodes (14): DashboardView(), ORDERS, STOCK_BURN, ORDERS, CATEGORY_STOCK, ORDER_STATUS, REVENUE_TREND, PageHeader() (+6 more)

### Community 9 - "App Layout & Theme"
Cohesion: 0.10
Nodes (20): fraunces, metadata, GlobalBackground(), GlobalHeader(), AuthContext, AuthContextType, AuthProvider(), getNavigationSections() (+12 more)

### Community 10 - "Badge & Checkbox UI"
Cohesion: 0.09
Nodes (14): Badge(), badgeVariants, Checkbox(), HoverCardContent(), ResizableHandle(), ResizablePanelGroup(), Slider(), Switch() (+6 more)

### Community 11 - "Alert Dialog UI"
Cohesion: 0.10
Nodes (17): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay(), AlertDialogTitle() (+9 more)

### Community 12 - "Error Handling"
Cohesion: 0.13
Nodes (11): AppError, AuthenticationError, AuthorizationError, DatabaseError, NotFoundError, StoredProcedureError, Handler, HandlerWithParams (+3 more)

### Community 13 - "Catalog API & Data"
Cohesion: 0.22
Nodes (16): DELETE(), GET(), PATCH(), POST(), UseCatalogDataResult, CatalogProduct, CategoryForFilter, createCatalogProduct() (+8 more)

### Community 14 - "Data Access Types"
Cohesion: 0.10
Nodes (19): ApiResponse, Category, CreateOrderParams, CreateProductParams, CreateSupplierParams, Customer, Inventory, Order (+11 more)

### Community 15 - "Categories API"
Cohesion: 0.16
Nodes (10): createCategoryHandler(), GET, getCategoriesHandler(), PATCH, POST, updateCategoryHandler(), CategoriesAdapter, Category (+2 more)

### Community 16 - "Dashboard Grid Types"
Cohesion: 0.18
Nodes (14): DashboardLayout, DragItem, EditMode, GridCell, GridConfig, WidgetDefinition, createFromTemplate(), DASHBOARD_TEMPLATES (+6 more)

### Community 17 - "Invoicing Page"
Cohesion: 0.23
Nodes (9): INVOICES, Movement, EmptyState(), EmptyStateProps, Skeleton(), Column, TacticalTable(), TacticalTableProps (+1 more)

### Community 18 - "Response Builder"
Cohesion: 0.14
Nodes (7): GET, GET, getErrorCode(), ApiResponse, ErrorResponse, PaginationMeta, SuccessResponse

### Community 19 - "Context Menu UI"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 20 - "Dropdown Menu UI"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 21 - "Products API"
Cohesion: 0.20
Nodes (6): GET(), getProductByIdHandler(), GET, getProductsHandler(), withErrorHandling(), ProductsAdapter

### Community 22 - "Carousel UI"
Cohesion: 0.20
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 23 - "Form Field UI"
Cohesion: 0.20
Nodes (11): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+3 more)

### Community 24 - "Orders Data Hook"
Cohesion: 0.21
Nodes (7): UseOrdersDataOptions, UseOrdersDataResult, getSupabaseServiceClient(), SupabaseServiceClient, ListOrdersParams, Order, Database

### Community 25 - "Purchase Order Detail"
Cohesion: 0.28
Nodes (10): UsePurchaseOrderDetailResult, AddItemInput, addPurchaseOrderItem(), db(), deletePurchaseOrderItem(), getPurchaseOrderDetail(), PurchaseOrderDetail, PurchaseOrderItem (+2 more)

### Community 26 - "Variants Data Hook"
Cohesion: 0.27
Nodes (10): UseVariantsDataResult, createVariant(), CreateVariantInput, db(), deleteVariant(), listProductsForFilter(), listVariants(), ProductForFilter (+2 more)

### Community 28 - "Inventory Page UI"
Cohesion: 0.24
Nodes (7): FALLBACK_INVENTORY, InventoryItem, InventoryView(), mapInventoryImage(), getProjectIdFromSlug(), getUserProject(), verifyUserProjectAccess()

### Community 29 - "Inventory Movements"
Cohesion: 0.36
Nodes (7): GET(), UseInventoryMovementsDataResult, db(), InventoryItemForFilter, listInventoryItems(), listInventoryMovements(), MovementWithInventory

### Community 30 - "Chart UI"
Cohesion: 0.25
Nodes (9): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), THEMES (+1 more)

### Community 31 - "Drawer UI"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 32 - "Select UI"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 33 - "Product Lines Hook"
Cohesion: 0.25
Nodes (7): UseProductLinesDataResult, createProductLine(), CreateProductLineInput, db(), deleteProductLine(), listProductLines(), ProductLine

### Community 35 - "Navigation Menu UI"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 36 - "Customers Data Hook"
Cohesion: 0.31
Nodes (5): GET, UseCustomersDataOptions, UseCustomersDataResult, Customer, ListCustomersParams

### Community 37 - "Inventory Data Types"
Cohesion: 0.22
Nodes (7): InventoryAlert, InventoryItem, InventoryMovement, InventoryStats, InventoryValuation, InventoryVariant, MovementStats

### Community 38 - "Supabase Service"
Cohesion: 0.22
Nodes (7): supabaseService, Enums, Json, PublicSchema, Tables, TablesInsert, TablesUpdate

### Community 39 - "Theme Definitions"
Cohesion: 0.28
Nodes (4): banner, layout, adminHud, spacing

### Community 41 - "Inventory API Handlers"
Cohesion: 0.25
Nodes (5): adjustInventoryHandler(), createMovementHandler(), getInventoryMovementsHandler(), POST, GET

### Community 42 - "Purchase Orders Hook"
Cohesion: 0.32
Nodes (5): UsePurchaseOrdersDataOptions, UsePurchaseOrdersDataResult, listPurchaseOrders(), ListPurchaseOrdersParams, PurchaseOrderWithSupplier

### Community 45 - "API Adapter Types"
Cohesion: 0.33
Nodes (5): AdapterOptions, AdapterResult, CountedResult, FilterParams, PaginationParams

### Community 46 - "Alert UI"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 47 - "Input OTP UI"
Cohesion: 0.40
Nodes (3): InputOTP(), InputOTPGroup(), InputOTPSlot()

### Community 49 - "Categories Data Hook"
Cohesion: 0.40
Nodes (3): Category, CategoryOption, CategoryStats

## Knowledge Gaps
- **192 isolated node(s):** `CATALOG`, `Customer`, `STOCK_BURN`, `ORDERS`, `InventoryItem` (+187 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Accordion & Avatar UI` to `CRUD API Routes`, `Select UI`, `Input & Sheet UI`, `Auth & Command UI`, `Navigation Menu UI`, `Badge & Checkbox UI`, `Alert Dialog UI`, `Alert UI`, `Input OTP UI`, `Popover UI`, `Context Menu UI`, `Dropdown Menu UI`, `Carousel UI`, `Form Field UI`, `Chart UI`, `Drawer UI`?**
  _High betweenness centrality (0.344) - this node is a cross-community bridge._
- **Why does `SupabaseServiceClient` connect `Orders Data Hook` to `Product Lines Hook`, `Orders API & Adapter`, `Customers Data Hook`, `Inventory Alert API`, `Inventory & Supplier UI`, `Customers Adapter`, `Purchase Orders Hook`, `Error Handling`, `Catalog API & Data`, `Categories API`, `Products API`, `Purchase Order Detail`, `Variants Data Hook`, `Inventory Movements`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `Database` connect `Orders Data Hook` to `Supabase Service`, `App Layout & Theme`, `Customers Page UI`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `CATALOG`, `Customer`, `STOCK_BURN` to the rest of the system?**
  _192 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CRUD API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.05119214586255259 - nodes in this community are weakly interconnected._
- **Should `Accordion & Avatar UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06485671191553545 - nodes in this community are weakly interconnected._
- **Should `Input & Sheet UI` be split into smaller, more focused modules?**
  _Cohesion score 0.054693877551020405 - nodes in this community are weakly interconnected._