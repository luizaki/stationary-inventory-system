import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';

const PurchaseStock = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [distributors, setDistributors] = useState([]);
  const [items, setItems] = useState([]);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { itemId: '', quantity: 1, unitCost: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch user role on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const role = user.user_metadata?.role;
          setRole(role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const { data: distributorsData, error: distributorsError } = await supabase
          .from('distributor')
          .select('id, name')
          .order('name');
        if (distributorsError) throw distributorsError;
        setDistributors(distributorsData || []);

        const { data: itemsData, error: itemsError } = await supabase
          .from('item')
          .select('id, name, category_id, base_price');
        if (itemsError) throw itemsError;
        setItems(itemsData || []);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load distributors/items from database. Please try again.');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddItem = () => {
    setPurchaseItems([...purchaseItems, { itemId: '', quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (purchaseItems.length > 1) {
      const updatedItems = purchaseItems.filter((_, i) => i !== index);
      setPurchaseItems(updatedItems);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'itemId') {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index].unitCost = selectedItem.base_price || 0;
      }
    }

    setPurchaseItems(updatedItems);
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((total, item) => {
      return total + (Number(item.quantity) * Number(item.unitCost));
    }, 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedDistributor) {
        throw new Error('Please select a distributor');
      }

      const validDistributor = distributors.some(d => d.id === selectedDistributor);
      if (!validDistributor) {
        throw new Error('Selected distributor is invalid. Please reselect from the list.');
      }

      if (!purchaseDate) {
        throw new Error('Please select a purchase date');
      }

      if (purchaseItems.some(item => !item.itemId || item.quantity <= 0 || item.unitCost < 0)) {
        throw new Error('Please fill in all item details correctly');
      }

      // Generate a new UUID for the purchase
      const purchaseId = crypto.randomUUID();
      
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchase')
        .insert([
          {
            id: purchaseId,
            distributor_id: selectedDistributor,
            purchase_date: purchaseDate,
            status: 'completed'
          }
        ])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items with proper UUIDs
      const purchaseItemsToInsert = purchaseItems.map(item => ({
        id: crypto.randomUUID(),
        purchase_id: purchaseData.id,
        item_id: item.itemId,
        quantity: Number(item.quantity),
        unit_cost: Number(item.unitCost)
        // omit condition so it remains NULL unless explicitly provided via UI
      }));

      const { error: itemsError } = await supabase
        .from('purchase_item')
        .insert(purchaseItemsToInsert);

      if (itemsError) throw itemsError;

      // Update stock quantities
      const updatePromises = purchaseItems.map(async (item) => {
        const { error: rpcError } = await supabase.rpc('increment_item_stock', {
          item_id: item.itemId,
          amount: Number(item.quantity)
        });
        if (rpcError) {
          const { data: itemRow, error: selectErr } = await supabase
            .from('item')
            .select('stock_quantity')
            .eq('id', item.itemId)
            .single();
          if (selectErr) throw selectErr;

          const newQty = (itemRow?.stock_quantity || 0) + Number(item.quantity);
          const { error: updateErr } = await supabase
            .from('item')
            .update({ stock_quantity: newQty })
            .eq('id', item.itemId);
          if (updateErr) throw updateErr;
        }
      });

      await Promise.all(updatePromises);

      setSuccess('Purchase order created successfully!');
      setPurchaseItems([{ itemId: '', quantity: 1, unitCost: 0 }]);
      setSelectedDistributor('');
      setPurchaseDate('');
    } catch (error) {
      console.error('Error submitting purchase:', error);
      setError(error.message || 'Failed to create purchase order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role={role} />
      
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Purchase Stock</h1>
              <p className="mt-1 text-sm text-gray-500">Add new stock purchases to inventory</p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            {error && (
              <div className="mb-6 p-4 rounded-md bg-red-50 border-l-4 border-red-500">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-md bg-green-50 border-l-4 border-green-500">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label htmlFor="distributor" className="block text-sm font-medium text-gray-700 mb-1">
                    Distributor <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="distributor"
                    value={selectedDistributor}
                    onChange={(e) => setSelectedDistributor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={dataLoading}
                    required
                  >
                    {!dataLoading && <option value="">Select a distributor</option>}
                    {dataLoading ? (
                      <option value="">Loading distributors...</option>
                    ) : (
                      distributors.map((distributor) => (
                        <option key={distributor.id} value={distributor.id}>
                          {distributor.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="purchaseDate"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={item.itemId}
                              onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              required
                            >
                              <option value="">Select an item</option>
                              {items.map((itm) => (
                                <option key={itm.id} value={itm.id}>
                                  {itm.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                className="pl-7 pr-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required
                              />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${(item.quantity * item.unitCost).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {purchaseItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <div className="text-right">
                    <div className="text-base font-medium text-gray-900">
                      Total: ${calculateTotal()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {loading ? 'Processing...' : 'Create Purchase Order'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PurchaseStock;
